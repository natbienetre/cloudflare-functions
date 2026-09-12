## Context

See proposal.md - Why. This is a documentation-only change; there is no code, type, or runtime behavior to design. The only design-relevant question is what to say and where.

## Goals / Non-Goals

**Goals:**
- Accurately document the plugin's actual cookie-security behavior (`Secure`/`HttpOnly` always set, no opt-out) so future contributors don't repeat the abandoned `allowInsecureCookies` proposal without first checking the `localhost` exemption.
- Give affected local-dev users (Safari, `127.0.0.1`, custom local hostnames) a concrete, already-supported workaround.

**Non-Goals:**
- Do not add any plugin-level configuration flag or code change. The abandoned `allow-insecure-cookies-for-dev` change already fully designed and implemented that approach; this proposal deliberately does not revive it, per review feedback that the premise was largely unfounded.
- Do not attempt to document every browser's exact trustworthy-origin rules in depth; link to the browsers' own exemption for `localhost` and to Cloudflare's `wrangler pages dev` local-HTTPS flags, rather than restating browser-internal spec details that may change over time.

## Decisions

- **Single new file: `plugins/cloudflare-auto-session/README.md`.** No README exists for this package today; this is the natural place to document `PluginArgs`, the cookie-security defaults, and the `localhost`/`wrangler --local-protocol=https` guidance together.
- **Point to `wrangler pages dev --local-protocol=https` as the recommended fix for the residual gap**, rather than documenting a plugin-level workaround, since it requires no plugin code change, works for every browser (including Safari), and is Cloudflare's own supported mechanism for local HTTPS dev.

## Risks / Trade-offs

- [Risk] Browser vendors could change or remove the `localhost` exemption in the future, making the documented "it usually just works" claim stale. → Mitigation: phrase it as current browser behavior, not a guarantee, and always present the `--local-protocol=https` option as the browser-independent fallback.
