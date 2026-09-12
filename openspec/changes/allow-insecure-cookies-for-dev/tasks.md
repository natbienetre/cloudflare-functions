## 1. Add the opt-in configuration flag

- [ ] 1.1 Add `allowInsecureCookies?: boolean` to `PluginArgs<Data>` in `plugins/cloudflare-auto-session/src/types.ts`, with a doc comment stating it defaults to `false`/secure and is intended for local development only.
- [ ] 1.2 Add `allowInsecureCookies: false` to `Defaults` in `plugins/cloudflare-auto-session/src/args.ts`, and verify `withDefaults()`'s return type (`PluginArgsWithDefaults<Data>`) includes the new field.

## 2. Thread the flag into `Session`

- [ ] 2.1 Add an `allowInsecureCookies: boolean` constructor parameter to `Session` in `plugins/cloudflare-auto-session/src/session.ts`, stored as a `readonly` instance field alongside `cookieSecret`/`isValid`.
- [ ] 2.2 In `Session.start()`, replace the hard-coded `true` passed as the `secure` argument to `Cookie.setCookieHeader(...)` with `!this.allowInsecureCookies`, and verify `yarn build` (wrangler) succeeds.
- [ ] 2.3 In `Session.end()`, apply the same change (`!this.allowInsecureCookies` instead of hard-coded `true` for `secure`), and verify `yarn build` succeeds.
- [ ] 2.4 Confirm the `HttpOnly` argument in both `start()` and `end()` remains hard-coded `true` (unchanged) - no task needed beyond a read-through check.
- [ ] 2.5 Update both `new Session(cookieName, cookieSecret, isValid)` call sites in `plugins/cloudflare-auto-session/functions/_middleware.ts` (in `onRequestGet` and `onRequestPost`) to destructure `allowInsecureCookies` from `withDefaults(pluginArgs)` and pass it as the new constructor argument.

## 3. Tests

- [ ] 3.1 Add a `plugins/cloudflare-auto-session/test/session.test.mjs` covering: (a) default (`allowInsecureCookies` unset/false) `Session.start()` and `Session.end()` emit `Secure` and `HttpOnly`; (b) `allowInsecureCookies: true` omits `Secure` but keeps `HttpOnly` on both `start()` and `end()`. Verify `yarn test` passes.
- [ ] 3.2 Run the existing `plugins/cloudflare-auto-session/test/cookie.test.mjs` and confirm it still passes unmodified (this change does not touch `Cookie.setCookieHeader()` itself).

## 4. Documentation

- [ ] 4.1 Document the new `allowInsecureCookies` plugin argument (what it does, default, and the "local development only, do not enable in production" guidance from design.md) in `plugins/cloudflare-auto-session`'s plugin-argument documentation. If no README exists yet for this package, add a minimal one covering `PluginArgs` and this flag; otherwise extend the existing docs.
- [ ] 4.2 If `examples/cloudflare-env-var-password` or another example wires up the plugin for local dev, consider adding a commented-out or environment-conditional `allowInsecureCookies: true` example there to make local dev usage discoverable. Skip if no example currently demonstrates local `wrangler pages dev` usage of this plugin.

## 5. Manual verification

- [ ] 5.1 Run `wrangler pages dev` locally against a page using `cloudflare-auto-session` with `allowInsecureCookies: true`, complete a login, and confirm the browser stores and resends the session cookie on `http://localhost`. Confirm the default (flag unset) still fails to persist the cookie over plain HTTP, matching pre-change behavior, to validate the opt-in is actually required.
