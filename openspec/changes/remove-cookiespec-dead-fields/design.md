## Context

See proposal.md - Why. Two independent call sites currently build a `CookieSpec` with a computed `secure` value (`plugins/cloudflare-auto-session/src/args.ts`'s `Defaults.login`, and `plugins/cloudflare-env-var-password/src/authenticator.ts`'s `Auth.cookieSpec()`), both following the same `url.protocol === 'https:'` pattern, and both hit the same latent bug: over plain HTTP, `Session.start()` throws because `secure` evaluates to `false`. `Session.start()`'s hard-coded `true, true` arguments to `Cookie.setCookieHeader()` mean the thrown value never actually reflected the emitted cookie either way.

## Goals / Non-Goals

**Goals:**
- Remove `secure`/`httpOnly` from `CookieSpec<Data>` and every place that reads, validates, or sets them.
- Fix the plain-HTTP throw in both `Defaults.login` and `Auth.cookieSpec()` as a side effect of removing the dead fields (not via a separate bugfix).

**Non-Goals:**
- Do not change `Cookie.setCookieHeader()`'s own `secure`/`httpOnly` parameters, defaults, or output format - they are general-purpose and still exercised directly by `test/cookie.test.mjs`.
- Do not change `Session.end()` - it already hard-codes `true, true` and never read `CookieSpec`.
- Do not add new tests for `Session.start()` or `Auth.cookieSpec()` beyond what tasks.md calls for; this is a deletion, not new functionality, so the bar is "existing coverage still passes," not "add coverage for a bug that can no longer occur."

## Decisions

- **Delete the fields rather than deprecate them.** `CookieSpec` is an input type for a single first-party plugin API (`PluginArgs.login`'s return value); there is no external/published consumer registry to support a slower deprecation cycle, and both in-repo consumers are updated in the same change. A silent no-op field (keep it, ignore its value) would perpetuate the exact confusion this change is meant to resolve.
- **Also fix `Auth.cookieSpec()` in `cloudflare-env-var-password`, not just `Defaults.login`.** Both are real call sites with the identical bug; leaving one in place would still throw on plain HTTP and would fail to compile in strict mode anyway once the field is removed from `CookieSpec` (excess-property checking on the returned object literal).
- **Leave `Cookie.setCookieHeader()` untouched.** Its `secure`/`httpOnly` parameters are not part of `CookieSpec` and are still meaningfully exercised (the two existing `test/cookie.test.mjs` cases pass explicit values). Removing scope creep keeps this change reviewable as a pure dead-field cleanup.

## Risks / Trade-offs

- [Risk] A downstream consumer outside this repo may set `secure`/`httpOnly` on a `CookieSpec` and hit a compile error after upgrading. → Mitigation: this is a first-party internal plugin (not published as a general-purpose npm package with wide external adoption); the fields never had any effect other than throwing on `false`, so any such consumer was already relying on dead/confusing behavior. Document as **BREAKING** in the proposal and changelog/release notes at publish time.
- [Risk] Removing the validation branch in `Session.start()` silently drops what looked like a safety check. → Mitigation: the "safety" was illusory - it only rejected `false`, never enforced anything about the emitted header, which is unconditionally secure regardless. No real guarantee is lost.
