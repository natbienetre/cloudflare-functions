# @natbienetre/cloudflare-auto-session

A [Cloudflare Pages Plugin](https://developers.cloudflare.com/pages/functions/plugins/) that gates access to your Pages Function behind a signed, `Secure`/`HttpOnly` session cookie, serving a login form until the visitor authenticates.

## Plugin arguments (`PluginArgs<Data>`)

| Argument       | Type                                               | Default          | Description                                                                                      |
| -------------- | -------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `cookieName`   | `string`                                           | -                | Name of the session cookie.                                                                      |
| `cookieSecret` | `string`                                           | -                | HMAC secret used to sign the cookie's data.                                                      |
| `formAsset`    | `string`                                           | -                | Path to the static login form asset served to unauthenticated visitors.                          |
| `byPass`       | `(request: Request) => Promise<boolean>`           | resolves `false` | Called per-request; when it resolves `true`, the session check is skipped entirely.              |
| `login`        | `(request: Request) => Promise<SessionSpec<Data>>` | see source       | Resolves the outcome of a login attempt (`authenticated`, `allowed`, and the `cookie` to issue). |
| `isValid`      | `(data: Data) => boolean`                          | `true`           | Validates the decoded, signature-verified session data on every request.                         |

## Cookie security

Session cookies issued by this plugin always have `Secure` and `HttpOnly` set. There is no configuration option to opt out of either attribute - this is intentional (see [PR #9](https://github.com/natbienetre/cloudflare-functions/pull/9) and [PR #11](https://github.com/natbienetre/cloudflare-functions/pull/11)).

### Local development over plain HTTP

Browsers generally refuse to store a cookie marked `Secure` unless it was received over HTTPS. However, **Chrome and Firefox treat the literal hostname `localhost` as a trustworthy origin**, and accept/send `Secure` cookies over plain `http://localhost` - so the default `wrangler pages dev` local URL (`http://localhost:<port>`) already works with this plugin out of the box, with no configuration needed.

This exemption is specific to the literal name `localhost` (and its subdomains). It does **not** reliably apply to:

- Safari, which does not implement this exemption at all
- `http://127.0.0.1` (behavior is less consistent across browsers)
- a custom local hostname (e.g. `app.local`), even if it resolves to a loopback address

If you hit one of those cases and the session doesn't persist locally, serve `wrangler pages dev` over real local HTTPS instead:

```bash
npx wrangler pages dev --local-protocol=https ./dist
```

By default this uses a self-signed certificate (your browser will warn about it). For a browser-trusted local certificate, generate one with [`mkcert`](https://github.com/FiloSottile/mkcert) and pass it explicitly:

```bash
npx wrangler pages dev ./dist \
  --local-protocol=https \
  --https-cert-path ./certs/localhost.pem \
  --https-key-path ./certs/localhost-key.pem
```

This requires no plugin configuration and works consistently across all browsers - there is no `allowInsecureCookies`-style opt-out in this plugin, and none is planned, since this `wrangler` flag already covers the gap without weakening the plugin's cookie-security defaults.
