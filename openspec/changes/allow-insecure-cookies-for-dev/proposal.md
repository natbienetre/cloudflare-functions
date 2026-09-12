## Why

`Session.start()` and `Session.end()` in `plugins/cloudflare-auto-session/src/session.ts` unconditionally set the `Secure` attribute on the session cookie (hard-coded `true`, added by two automated security-hardening PRs, #9 and #11). Browsers refuse to store a `Secure` cookie unless the response was received over HTTPS, so the plugin's login flow silently fails to persist a session whenever the Pages Function is served over plain HTTP - most notably during local development with `wrangler pages dev` on `http://localhost`, which does not terminate TLS. There is currently no way to run the plugin locally with a working session.

## What Changes

- Add a new, explicit, opt-in plugin argument `allowInsecureCookies` (default `false`) to `PluginArgs<Data>` (`plugins/cloudflare-auto-session/src/types.ts`). When `false` (the default, including when unset), behavior is unchanged: session cookies are always `Secure`.
- When a deployer sets `allowInsecureCookies: true`, `Session.start()`/`Session.end()` omit the `Secure` attribute so the session cookie is stored and sent over plain HTTP. This flag is intended for local development only; production/staging deployments should leave it unset.
- No change to the `HttpOnly` attribute: it is not scheme-dependent (browsers accept `HttpOnly` over plain HTTP) and stays unconditionally `true` in all cases, matching current behavior.
- No change to `CookieSpec<Data>`: the per-login-response `secure`/`httpOnly` fields there remain as they are today (out of scope for this change; this proposal only adds a plugin-level opt-in, not a per-request override).
- Thread `allowInsecureCookies` from `PluginArgs` through `withDefaults()` (`src/args.ts`) into the `Session` constructor and its two Pages Function handlers (`functions/_middleware.ts`).

## Capabilities

### New Capabilities

- `session-cookie-security`: Documents the plugin's cookie-security defaults (`Secure` and `HttpOnly` by default) and the explicit, opt-in escape hatch for non-HTTPS deployments.

### Modified Capabilities

(none - no existing capability specs in this repo yet)

## Impact

- **Affected code**: `plugins/cloudflare-auto-session/src/types.ts` (`PluginArgs`), `src/args.ts` (`Defaults`/`withDefaults`), `src/session.ts` (`Session` constructor, `start()`, `end()`), `functions/_middleware.ts` (both handlers construct `Session`).
- **Affected consumers**: `plugins/cloudflare-env-var-password` (and any other plugin built on `cloudflare-auto-session`) is unaffected unless it chooses to set `allowInsecureCookies` itself - it forwards `PluginArgs` through to `cloudflare-auto-session` and does not construct `Session` directly.
- **Compatibility**: Additive and backward-compatible. Default behavior (flag unset) is identical to today's unconditional `Secure`/`HttpOnly`. No existing consumer needs to change.
- **Documentation**: `plugins/cloudflare-auto-session` has no README today; this change should note the new flag wherever plugin arguments are otherwise documented (see tasks.md).
