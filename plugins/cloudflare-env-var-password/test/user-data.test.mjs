import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  clearUserDataCookieHeader,
  extractUserData,
  setUserDataCookieHeader,
  signUserData,
} from '../src/user-data.ts';
import { withDefaults } from '../src/args.ts';

const encoder = new TextEncoder();

function encodePem(label, data) {
  const base64 = Buffer.from(data).toString('base64');
  const lines = base64.match(/.{1,64}/g).join('\n');
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

function decodeBase64Url(value) {
  return Buffer.from(value, 'base64url');
}

test('extractUserData keeps only allowlisted string fields', () => {
  const formData = new FormData();
  formData.append('password', 'secret');
  formData.append('displayName', 'Alice');
  formData.append('group', 'one');
  formData.append('group', 'two');
  formData.append('ignored', '<script>alert(1)</script>');

  assert.deepEqual(extractUserData(formData, ['displayName', 'group']), {
    displayName: ['Alice'],
    group: ['one', 'two'],
  });
});

test('extractUserData rejects oversized field values', () => {
  const formData = new FormData();
  formData.append('displayName', 'x'.repeat(257));

  assert.throws(
    () => extractUserData(formData, ['displayName']),
    /Invalid value/
  );
});

test('signUserData creates a verifiable ES256 JWS with expiry', async () => {
  const keys = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
  const privateKey = await crypto.subtle.exportKey('pkcs8', keys.privateKey);
  const token = await signUserData(
    { displayName: ['Alice'] },
    encodePem('PRIVATE KEY', privateKey),
    { cookieName: 'user-data', maxAge: 300 },
    1_700_000_000_000
  );
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  assert.equal(
    await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      keys.publicKey,
      decodeBase64Url(encodedSignature),
      encoder.encode(signingInput)
    ),
    true
  );
  assert.deepEqual(JSON.parse(decodeBase64Url(encodedHeader)), {
    alg: 'ES256',
    typ: 'JWT',
  });
  assert.deepEqual(JSON.parse(decodeBase64Url(encodedPayload)), {
    iat: 1_700_000_000,
    exp: 1_700_000_300,
    userData: { displayName: ['Alice'] },
  });

  const tamperedPayload = Buffer.from(
    JSON.stringify({ iat: 1_700_000_000, exp: 1_700_000_300, userData: {} })
  ).toString('base64url');
  assert.equal(
    await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      keys.publicKey,
      decodeBase64Url(encodedSignature),
      encoder.encode(`${encodedHeader}.${tamperedPayload}`)
    ),
    false
  );
});

test('user data cookie is readable and can be cleared', () => {
  const config = { cookieName: 'user-data', maxAge: 300 };

  assert.equal(
    setUserDataCookieHeader('token', config),
    'user-data=token; Path=/; Max-Age=300; Secure; SameSite=Lax'
  );
  assert.equal(
    clearUserDataCookieHeader(config),
    'user-data=; Path=/; Max-Age=0; Secure; SameSite=Lax'
  );
});

test('user data cookie configuration excludes the password field', () => {
  const args = {
    passwordFieldName: 'password',
    userDataCookie: {
      fields: ['password'],
      privateKeyEnvVarName: 'USER_DATA_PRIVATE_KEY',
    },
  };

  assert.throws(() => withDefaults(args), /exclude the password field/);
});

test('user data cookie configuration receives safe defaults', () => {
  const args = {
    userDataCookie: {
      fields: ['displayName'],
      privateKeyEnvVarName: 'USER_DATA_PRIVATE_KEY',
    },
  };

  assert.deepEqual(withDefaults(args).userDataCookie, {
    fields: ['displayName'],
    privateKeyEnvVarName: 'USER_DATA_PRIVATE_KEY',
    cookieName: '__Host-cloudflare-user-data',
    maxAge: 3600,
  });
});
