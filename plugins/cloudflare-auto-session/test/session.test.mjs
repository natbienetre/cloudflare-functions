import assert from 'node:assert/strict';
import test from 'node:test';

import { Session } from '../src/session.ts';

const cookieSpec = { data: {} };

test('default (allowInsecureCookies unset) start() emits Secure and HttpOnly', () => {
  const session = new Session('session', 'secret', () => true);

  const response = session.start(
    new Request('https://example.com/'),
    cookieSpec
  );

  const header = response.headers.get('Set-Cookie');
  assert.match(header, /Secure/);
  assert.match(header, /HttpOnly/);
});

test('default (allowInsecureCookies unset) end() emits Secure and HttpOnly', () => {
  const session = new Session('session', 'secret', () => true);

  const response = session.end(new Response('ok'));

  const header = response.headers.get('Set-Cookie');
  assert.match(header, /Secure/);
  assert.match(header, /HttpOnly/);
});

test('allowInsecureCookies: false explicitly still emits Secure and HttpOnly on start()', () => {
  const session = new Session('session', 'secret', () => true, false);

  const response = session.start(new Request('http://localhost/'), cookieSpec);

  const header = response.headers.get('Set-Cookie');
  assert.match(header, /Secure/);
  assert.match(header, /HttpOnly/);
});

test('allowInsecureCookies: true omits Secure but keeps HttpOnly on start()', () => {
  const session = new Session('session', 'secret', () => true, true);

  const response = session.start(new Request('http://localhost/'), cookieSpec);

  const header = response.headers.get('Set-Cookie');
  assert.doesNotMatch(header, /Secure/);
  assert.match(header, /HttpOnly/);
});

test('allowInsecureCookies: true omits Secure but keeps HttpOnly on end()', () => {
  const session = new Session('session', 'secret', () => true, true);

  const response = session.end(new Response('ok'));

  const header = response.headers.get('Set-Cookie');
  assert.doesNotMatch(header, /Secure/);
  assert.match(header, /HttpOnly/);
});
