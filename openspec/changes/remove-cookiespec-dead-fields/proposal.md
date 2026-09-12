## Why

`CookieSpec.secure` and `CookieSpec.httpOnly` (in `plugins/cloudflare-auto-session/src/types.ts`) no longer influence the emitted `Set-Cookie` header. `Session.start()` always calls `Cookie.setCookieHeader(...)` with hard-coded `true, true` for the secure/httpOnly positional arguments (added when session cookies were made unconditionally secure), so the only remaining effect of these two fields is a validation check in `start()` that throws if a caller explicitly passes `false`. This makes the fields misleading: a caller reading the type signature reasonably expects `secure: false` to produce an insecure cookie, but it instead throws, and any other value (`true` or `undefined`) is a no-op. Additionally, `Defaults.login` in `src/args.ts` computes `secure: url.protocol === 'https:'`, which means the default login handler throws whenever a request is served over plain HTTP - a latent bug caused directly by this dead field.

## What Changes

- **BREAKING**: Remove the `secure` and `httpOnly` fields from `CookieSpec<Data>` (`plugins/cloudflare-auto-session/src/types.ts`). Session cookies remain unconditionally `Secure` and `HttpOnly`; callers can no longer request otherwise and can no longer trigger the "must be Secure and HttpOnly" validation error.
- Remove the now-dead `cookieSpec.secure === false || cookieSpec.httpOnly === false` validation branch from `Session.start()` (`plugins/cloudflare-auto-session/src/session.ts`).
- Remove the now-invalid `secure: url.protocol === 'https:'` and `httpOnly: true` assignments from `Defaults.login` (`plugins/cloudflare-auto-session/src/args.ts`). Fixes the latent bug where the default login handler threw on plain-HTTP requests.
- Remove the equivalent `secure: this.url.protocol === 'https:'` and `httpOnly: true` assignments from `Auth.cookieSpec()` (`plugins/cloudflare-env-var-password/src/authenticator.ts`), which has the exact same latent bug as a real, published consumer of `CookieSpec`.
- No change to `Cookie.setCookieHeader()` (`plugins/cloudflare-auto-session/src/cookie.ts`): its own `secure`/`httpOnly` parameters and defaults are unrelated, general-purpose, and still exercised by `test/cookie.test.mjs`.

## Capabilities

### New Capabilities

- `session-cookie-security`: Documents that session cookies issued by `cloudflare-auto-session` are unconditionally `Secure` and `HttpOnly`, with no caller-configurable opt-out.

### Modified Capabilities

(none - no existing capability specs in this repo yet)

## Impact

- **Affected code**: `plugins/cloudflare-auto-session/src/types.ts` (`CookieSpec`), `src/session.ts` (`Session.start()`), `src/args.ts` (`Defaults.login`), `plugins/cloudflare-env-var-password/src/authenticator.ts` (`Auth.cookieSpec()`).
- **Affected consumers**: Any code that constructs a `CookieSpec` (via the `login` callback passed to the plugin) and currently sets `secure` or `httpOnly` will get a TypeScript compile error and must delete those fields. `plugins/cloudflare-env-var-password`'s `Auth.cookieSpec()` does so today and is updated as part of this change; `examples/cloudflare-env-var-password` does not construct a `CookieSpec` directly (it only supplies `getEnvVarName`), so it is unaffected.
- **Behavior fix**: default login over plain HTTP - in both `cloudflare-auto-session`'s `Defaults.login` and `cloudflare-env-var-password`'s `Auth.cookieSpec()` - no longer throws `Session cookies must be Secure and HttpOnly`.
- **Tests**: no existing test exercises `CookieSpec.secure`/`httpOnly` or the removed validation branch directly (verified via `plugins/cloudflare-auto-session/test/` and the absence of tests in `plugins/cloudflare-env-var-password`), so no test changes are required by the removal itself; `tasks.md` still calls for a regression check on both packages.
