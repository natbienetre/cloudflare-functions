## 1. Remove dead fields from `CookieSpec`

- [ ] 1.1 Remove the `secure` and `httpOnly` fields (and their doc comments) from `CookieSpec<Data>` in `plugins/cloudflare-auto-session/src/types.ts`, and verify the file still compiles in isolation (no other type references these fields).

## 2. Remove the dead validation and default computations

- [ ] 2.1 Remove the `if (cookieSpec.secure === false || cookieSpec.httpOnly === false) { throw ... }` branch from `Session.start()` in `plugins/cloudflare-auto-session/src/session.ts`, and verify `yarn build` (wrangler) still succeeds.
- [ ] 2.2 Remove the `secure: url.protocol === 'https:'` and `httpOnly: true` fields from `Defaults.login`'s returned cookie spec in `plugins/cloudflare-auto-session/src/args.ts`, and verify `yarn build` and `yarn lint` succeed.
- [ ] 2.3 Remove the `secure: this.url.protocol === 'https:'` and `httpOnly: true` fields from `Auth.cookieSpec()` in `plugins/cloudflare-env-var-password/src/authenticator.ts`, and verify `yarn build` and `yarn lint` succeed for that package.

## 3. Regression checks

- [ ] 3.1 Run `plugins/cloudflare-auto-session`'s existing test suite (`yarn test`, i.e. `test/cookie.test.mjs`) and confirm both cases still pass unmodified (they exercise `Cookie.setCookieHeader()` directly, which is unaffected by this change).
- [ ] 3.2 Manually trace `Session.start()` and `Auth.cookieSpec()` for a plain-HTTP request to confirm neither path throws and the emitted `Set-Cookie` header still includes `Secure` and `HttpOnly` (no dedicated test exists for either path today; document the trace instead of adding new test infrastructure as part of this change).
- [ ] 3.3 Grep the repo (`plugins/`, `examples/`) for any other reference to `CookieSpec.secure`, `CookieSpec.httpOnly`, or the removed error message text, and confirm none remain outside `Cookie.setCookieHeader()`'s own unrelated parameters.

## 4. Documentation

- [ ] 4.1 Check `plugins/cloudflare-auto-session/README.md` (if it documents `CookieSpec`) and `plugins/cloudflare-env-var-password/README.md` for any mention of `secure`/`httpOnly` on the session cookie spec, and update or remove it to match the new, unconditional behavior.
