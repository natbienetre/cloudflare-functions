import assert from 'node:assert/strict';
import test from 'node:test';

import { Cookie } from '../src/cookie.ts';

test('uses secure session cookie defaults', () => {
  const header = new Cookie('session').setCookieHeader('value');

  assert.equal(header, 'session=value; Secure; HttpOnly; SameSite=Lax');
});

test('preserves explicit secure cookie attributes', () => {
  const header = new Cookie('session').setCookieHeader(
    'value',
    'example.com',
    '/',
    undefined,
    60,
    true,
    true,
    'Strict'
  );

  assert.equal(
    header,
    'session=value; Domain=example.com; Path=/; Max-Age=60; Secure; HttpOnly; SameSite=Strict'
  );
});
