## 1. Remove dead fields from `CookieSpec`

- [x] 1.1 Remove the `secure` and `httpOnly` fields (and their doc comments) from `CookieSpec<Data>` in `plugins/cloudflare-auto-session/src/types.ts`, and verify the file still compiles in isolation (no other type references these fields).

## 2. Remove the dead validation and default computations

- [x] 2.1 Remove the `if (cookieSpec.secure === false || cookieSpec.httpOnly === false) { throw ... }` branch from `Session.start()` in `plugins/cloudflare-auto-session/src/session.ts`, and verify `yarn build` (wrangler) still succeeds.
- [x] 2.2 Remove the `secure: url.protocol === 'https:'` and `httpOnly: true` fields from `Defaults.login`'s returned cookie spec in `plugins/cloudflare-auto-session/src/args.ts` (type-cleanup only - this path is unreachable at runtime since `Defaults.login` always returns `authenticated: false`), and verify `yarn build` and `yarn lint` succeed.
- [x] 2.3 Remove the `secure: this.url.protocol === 'https:'` and `httpOnly: true` fields from `Auth.cookieSpec()` in `plugins/cloudflare-env-var-password/src/authenticator.ts`, and verify `yarn build` and `yarn lint` succeed for that package.

## 3. Regression checks

- [x] 3.1 Run `plugins/cloudflare-auto-session`'s existing test suite (`yarn test`, i.e. `test/cookie.test.mjs`) and confirm both cases still pass unmodified (they exercise `Cookie.setCookieHeader()` directly, which is unaffected by this change).
- [x] 3.2 Manually trace `Session.start()` for a plain-HTTP request via `Auth.cookieSpec()` (the one exercised failure path - `Defaults.login` never reaches `session.start()`) to confirm it no longer throws and the emitted `Set-Cookie` header still includes `Secure` and `HttpOnly` (no dedicated test exists for this path today; document the trace instead of adding new test infrastructure as part of this change).
- [x] 3.3 Grep the repo (`plugins/`, `examples/`) for any other reference to `CookieSpec.secure`, `CookieSpec.httpOnly`, or the removed error message text, and confirm none remain outside `Cookie.setCookieHeader()`'s own unrelated parameters.

## 4. Documentation

- [x] 4.1 Checked both READMEs. `cloudflare-auto-session/README.md` documents `PluginArgs`, not `CookieSpec` - it doesn't mention `CookieSpec.secure`/`httpOnly` at all (only mentions the unrelated, abandoned `allowInsecureCookies` proposal in the local-dev section, which is unaffected by this change). `cloudflare-env-var-password/README.md` doesn't mention `secure`/`httpOnly` either. No doc changes needed.
