## 1. Add the opt-in configuration flag

- [x] 1.1 Add `allowInsecureCookies?: boolean` to `PluginArgs<Data>` in `plugins/cloudflare-auto-session/src/types.ts`, with a doc comment stating it defaults to `false`/secure and is intended for local development only.
- [x] 1.2 Add `allowInsecureCookies: false` to `Defaults` in `plugins/cloudflare-auto-session/src/args.ts`, and verify `withDefaults()`'s return type (`PluginArgsWithDefaults<Data>`) includes the new field.

## 2. Thread the flag into `Session`

- [x] 2.1 Add an `allowInsecureCookies: boolean` constructor parameter to `Session` in `plugins/cloudflare-auto-session/src/session.ts`, stored as a `readonly` instance field alongside `cookieSecret`/`isValid`.
- [x] 2.2 In `Session.start()`, replace the hard-coded `true` passed as the `secure` argument to `Cookie.setCookieHeader(...)` with `!this.allowInsecureCookies`, and verify `yarn build` (wrangler) succeeds.
- [x] 2.3 In `Session.end()`, apply the same change (`!this.allowInsecureCookies` instead of hard-coded `true` for `secure`), and verify `yarn build` succeeds.
- [x] 2.4 Confirm the `HttpOnly` argument in both `start()` and `end()` remains hard-coded `true` (unchanged) - no task needed beyond a read-through check.
- [x] 2.5 Update both `new Session(cookieName, cookieSecret, isValid)` call sites in `plugins/cloudflare-auto-session/functions/_middleware.ts` (in `onRequestGet` and `onRequestPost`) to destructure `allowInsecureCookies` from `withDefaults(pluginArgs)` and pass it as the new constructor argument.

## 3. Tests

- [x] 3.1 Add a `plugins/cloudflare-auto-session/test/session.test.mjs` covering: (a) default (`allowInsecureCookies` unset/false) `Session.start()` and `Session.end()` emit `Secure` and `HttpOnly`; (b) `allowInsecureCookies: true` omits `Secure` but keeps `HttpOnly` on both `start()` and `end()`. Verify `yarn test` passes.
- [x] 3.2 Run the existing `plugins/cloudflare-auto-session/test/cookie.test.mjs` and confirm it still passes unmodified (this change does not touch `Cookie.setCookieHeader()` itself).

## 4. Documentation

- [x] 4.1 Document the new `allowInsecureCookies` plugin argument (what it does, default, and the "local development only, do not enable in production" guidance from design.md) in `plugins/cloudflare-auto-session`'s plugin-argument documentation. If no README exists yet for this package, add a minimal one covering `PluginArgs` and this flag; otherwise extend the existing docs.
- [x] 4.2 Skipped: `examples/cloudflare-env-var-password` wires up `@natbienetre/cloudflare-env-var-password`, not `cloudflare-auto-session` directly, via its own `AutoSessionArgs` passthrough type - which does not (and, per this proposal's stated impact, is not required to) expose `allowInsecureCookies`. No example in the repo constructs `cloudflare-auto-session`'s `PluginArgs<Data>` directly, so the task's own skip condition applies. (Adding passthrough support in `cloudflare-env-var-password` would be a separate, out-of-scope change - not covered by this proposal/design.)

## 5. Manual verification

- [x] 5.1 No dedicated Pages project exists to browser-test this plugin directly (`cloudflare-auto-session` has no example of its own; the repo's only example wires up a different plugin, `cloudflare-env-var-password`, which doesn't expose this flag - see task 4.2). Per user decision, treated the automated `test/session.test.mjs` coverage as sufficient: it directly asserts the `Set-Cookie` header omits `Secure` (while keeping `HttpOnly`) when `allowInsecureCookies: true`, and keeps both when unset/false, on both `start()` and `end()` - the same observable behavior a browser-based check would confirm. Skipped scaffolding a throwaway Pages project for a live `wrangler pages dev` check.
