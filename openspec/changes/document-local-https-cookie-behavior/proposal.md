## Why

A prior proposal in this repo (now abandoned - see history) assumed `Session.start()`/`Session.end()` in `plugins/cloudflare-auto-session/src/session.ts` hard-coding the `Secure` cookie attribute to `true` breaks local development under `wrangler pages dev` on plain HTTP, and set out to add an `allowInsecureCookies` opt-in flag. Review caught that this premise is largely false: Chrome and Firefox already treat the literal hostname `localhost` as a trustworthy origin and accept/send `Secure` cookies over `http://localhost` without any code change. The real, narrower gap (Safari, `127.0.0.1`, or a custom local hostname) already has a zero-risk fix that needs no plugin code change at all: `wrangler pages dev --local-protocol=https` (optionally with `--https-cert-path`/`--https-key-path`, e.g. via `mkcert`).

Given that, adding a plugin-level flag to relax the `Secure` attribute is not worth the security/maintenance cost it would add (new API surface, a real risk of accidental production misuse, more docs/tests to maintain) for a gap that a one-line `wrangler` CLI flag already covers. This proposal replaces that abandoned code change with a documentation-only fix: explain the `localhost` browser exemption and point local-dev users who hit the residual gap at `wrangler`'s own local-HTTPS support.

## What Changes

- Add a README for `plugins/cloudflare-auto-session` (none exists today) documenting `PluginArgs` and the plugin's cookie-security behavior (`Secure`/`HttpOnly` always set, no opt-out).
- In that README, document that Chrome/Firefox exempt literal `http://localhost` from the `Secure`-cookie-over-HTTP restriction, so most local dev "just works" without any configuration.
- Document that developers who still hit the restriction locally (Safari, `127.0.0.1`, a custom local hostname) should serve `wrangler pages dev` over local HTTPS via `--local-protocol=https` (optionally with `--https-cert-path`/`--https-key-path`), rather than needing any plugin-level insecure-cookie opt-out.
- No code, type, or behavior changes anywhere in the plugin. `Session.start()`/`Session.end()` remain exactly as they are today (unconditional `Secure`/`HttpOnly`).

## Capabilities

This is a documentation-only change with no spec-level behavior change (`skip_specs: true` set in `.openspec.yaml`); no new or modified capabilities.

## Impact

- **Affected files**: `plugins/cloudflare-auto-session/README.md` (new file only).
- **Affected code**: none. `session.ts`, `types.ts`, `args.ts`, and `functions/_middleware.ts` are unchanged.
- **Compatibility**: Purely additive documentation; no behavior change for any consumer.
