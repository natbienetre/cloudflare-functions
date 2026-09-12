## 1. Documentation

- [x] 1.1 Add `plugins/cloudflare-auto-session/README.md` documenting `PluginArgs` and the plugin's cookie-security behavior: `Secure` and `HttpOnly` are always set on session cookies, with no configuration to opt out.
- [x] 1.2 In that README, document that Chrome and Firefox treat the literal hostname `localhost` as a trustworthy origin, so `Secure` cookies are accepted and sent even over plain `http://localhost` (e.g. the default `wrangler pages dev` local URL) - meaning most local dev already works without any special configuration.
- [x] 1.3 In the same section, document the residual gap (Safari, `http://127.0.0.1`, or a custom local hostname that isn't literal `localhost`) and the fix: run `wrangler pages dev --local-protocol=https` (optionally with `--https-cert-path`/`--https-key-path`, e.g. via `mkcert`) to serve local dev over real HTTPS.
- [x] 1.4 Run `yarn prettier` in `plugins/cloudflare-auto-session` and confirm the new README passes formatting.

## 2. Verification (no code change)

- [x] 2.1 Confirm via `git diff` (or equivalent) that this change touches only `plugins/cloudflare-auto-session/README.md` and OpenSpec planning artifacts - no `.ts`/`.mjs` source or test files are modified.
- [x] 2.2 Run `yarn build`, `yarn test`, and `yarn lint` in `plugins/cloudflare-auto-session` to confirm the (unchanged) plugin still passes, as a sanity check that nothing was inadvertently touched.
