import type { UserData } from './types';

// Bound each untrusted form dimension and leave room below common 4 KiB cookie
// limits for the JWS header, signature, and cookie attributes.
const maxValuesPerField = 8;
const maxValueLength = 256;
const maxPayloadBytes = 2048;

const textEncoder = new TextEncoder();

interface UserDataClaims {
  iat: number;
  exp: number;
  userData: UserData;
}

interface UserDataCookieConfig {
  cookieName: string;
  keyId?: string;
  maxAge: number;
}

function encodeBase64Url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function encodeJson(value: object): string {
  return encodeBase64Url(textEncoder.encode(JSON.stringify(value)));
}

function decodePemPrivateKey(privateKeyPem: string): Uint8Array {
  const match = privateKeyPem
    .trim()
    .match(
      /^-----BEGIN PRIVATE KEY-----\s+([A-Za-z0-9+/=\s]+)\s+-----END PRIVATE KEY-----$/
    );

  if (match === null) {
    throw new Error('User data signing key must be a PKCS#8 PEM private key');
  }

  return Uint8Array.from(atob(match[1].replace(/\s/g, '')), character =>
    character.charCodeAt(0)
  );
}

async function importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'pkcs8',
    decodePemPrivateKey(privateKeyPem),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

export function extractUserData(
  formData: FormData,
  fields: readonly string[]
): UserData {
  const userData: UserData = {};

  // Only configured fields cross the request boundary. FormData values may
  // also be Files, which are rejected rather than implicitly stringified.
  for (const field of fields) {
    const values = formData.getAll(field);

    if (values.length > maxValuesPerField) {
      throw new Error(`Too many values for user data field: ${field}`);
    }

    if (
      values.some(
        value => typeof value !== 'string' || value.length > maxValueLength
      )
    ) {
      throw new Error(`Invalid value for user data field: ${field}`);
    }

    userData[field] = values as string[];
  }

  if (
    textEncoder.encode(JSON.stringify(userData)).byteLength > maxPayloadBytes
  ) {
    throw new Error('User data payload is too large');
  }

  return userData;
}

export async function signUserData(
  userData: UserData,
  privateKeyPem: string,
  config: UserDataCookieConfig,
  now: number = Date.now()
): Promise<string> {
  const issuedAt = Math.floor(now / 1000);
  const header = {
    alg: 'ES256',
    typ: 'JWT',
    ...(config.keyId === undefined ? {} : { kid: config.keyId }),
  };
  const claims: UserDataClaims = {
    iat: issuedAt,
    exp: issuedAt + config.maxAge,
    userData,
  };
  const signingInput = `${encodeJson(header)}.${encodeJson(claims)}`;
  // Import as non-extractable so application code cannot export the secret
  // key after Web Crypto has accepted it.
  const key = await importPrivateKey(privateKeyPem);
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      textEncoder.encode(signingInput)
    )
  );

  // ES256 JWS signatures use the 64-byte raw R || S representation returned
  // by Web Crypto, not an ASN.1 DER-encoded ECDSA signature.
  if (signature.byteLength !== 64) {
    throw new Error('Unexpected ES256 signature length');
  }

  return `${signingInput}.${encodeBase64Url(signature)}`;
}

export function setUserDataCookieHeader(
  token: string,
  config: UserDataCookieConfig
): string {
  // HttpOnly is deliberately omitted: browser code must be able to read and
  // verify this identification token. It is separate from the HttpOnly cookie
  // used for authorization. Omitting Domain keeps this cookie host-only.
  return `${config.cookieName}=${token}; Path=/; Max-Age=${config.maxAge}; Secure; SameSite=Lax`;
}

export function clearUserDataCookieHeader(
  config: UserDataCookieConfig
): string {
  return `${config.cookieName}=; Path=/; Max-Age=0; Secure; SameSite=Lax`;
}
