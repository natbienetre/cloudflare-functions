## Context

See proposal.md - Why. The `Secure` attribute is currently hard-coded `true` in two places in `plugins/cloudflare-auto-session/src/session.ts`: `Session.start()`'s call to `Cookie.setCookieHeader(...)` and `Session.end()`'s equivalent call. Both were changed to unconditional `true` by automated SAST-driven PRs (#9, #11) that also added a validation throw in `Session.start()` if a per-request `CookieSpec.secure`/`httpOnly` was `false`. `PluginArgs<Data>` (`src/types.ts`) is the plugin-level configuration object a deployer passes when registering the Pages Function plugin; `withDefaults()` (`src/args.ts`) fills in defaults for any field the deployer omits. `Session` is constructed fresh per-request in both Pages Function handlers in `functions/_middleware.ts`.

## Goals / Non-Goals

**Goals:**
- Provide a single, explicit, plugin-level opt-in (`allowInsecureCookies`) that a deployer sets once when configuring the plugin, not per-request.
- Preserve the current unconditional-`Secure`/`HttpOnly` behavior exactly when the flag is unset - this is a pure additive escape hatch, not a behavior change for existing users.

**Non-Goals:**
- Do not infer secure-vs-insecure from the request's scheme (`request.url.protocol`). This was the pre-#9/#11 behavior and is exactly what those hardening PRs removed; a request's declared scheme is not a trustworthy security signal behind an arbitrary reverse proxy, and reintroducing it would silently weaken production deployments that happen to be reachable over HTTP through a misconfiguration. The clarified scope for this change (local dev only) is served by an explicit flag, not auto-detection.
- Do not touch `HttpOnly`. It has no browser-side scheme restriction, so there is no functional problem to solve there; leaving it alone also keeps this change minimal and focused on the one attribute that actually blocks local dev.
- Do not change `CookieSpec<Data>` or the per-request `secure`/`httpOnly` fields on it. Those are a separate, pre-existing (and separately debated) part of the type surface; this change only adds a plugin-level default, not a per-request override.
- Do not add a runtime warning/log when `allowInsecureCookies: true` is combined with an HTTPS request (i.e. redundant but harmless). Out of scope; can be revisited later if it proves confusing in practice.

## Decisions

- **Plugin-level flag on `PluginArgs`, not a per-request field on `CookieSpec`.** Whether cookies may be insecure is a deployment-environment property (local dev vs. production), not something that varies per login/request. Putting it on `PluginArgs` means a deployer sets it once (e.g. via an environment-conditional value in their `_middleware.ts` wiring) rather than needing every `login` callback implementation to remember to set it consistently.
- **Default `false` (secure-by-default), threaded explicitly rather than inferred.** Matches the user's stated scope (local dev only) and keeps the security posture that PRs #9/#11 established as the default for anyone who does not consciously opt in. `withDefaults()` in `src/args.ts` is the single place that already establishes defaults for optional `PluginArgs` fields, so `allowInsecureCookies` extends that existing pattern.
- **`Session` gains the flag as a constructor parameter, computed once from the resolved `PluginArgs`, rather than re-reading `pluginArgs` inside `start()`/`end()`.** Consistent with how `cookieName`/`cookieSecret`/`isValid` are already threaded into `Session`'s constructor in both handlers in `functions/_middleware.ts`.
- **Keep the existing `cookieSpec.secure === false || cookieSpec.httpOnly === false` throw in `Session.start()` unchanged.** It is orthogonal to this change: it guards against a caller's per-request `CookieSpec` explicitly requesting an insecure cookie, which remains rejected regardless of `allowInsecureCookies` (the new flag is how a deployer allows insecure cookies, not how a caller's `login` callback can request them per-request).

## Risks / Trade-offs

- [Risk] A deployer accidentally sets `allowInsecureCookies: true` in a production configuration, weakening the security posture PRs #9/#11 established. → Mitigation: default is `false`; the flag name and its documentation should explicitly say "intended for local development only, do not set in production" (tasks.md includes a doc task for this).
- [Risk] Someone expects the flag to also relax `HttpOnly`. → Mitigation: name the flag specifically around `Secure`/insecure transport (`allowInsecureCookies`), not a generic "relax all cookie security" flag, and document that `HttpOnly` is unaffected.
