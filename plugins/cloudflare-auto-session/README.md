# @natbienetre/cloudflare-auto-session

A [Cloudflare Pages Plugin](https://developers.cloudflare.com/pages/functions/plugins/) that gates access to your Pages Function behind a signed, `Secure`/`HttpOnly` session cookie, serving a login form until the visitor authenticates.

## Plugin arguments (`PluginArgs<Data>`)

| Argument               | Type                                               | Default          | Description                                                                                      |
| ---------------------- | -------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `cookieName`           | `string`                                           | -                | Name of the session cookie.                                                                      |
| `cookieSecret`         | `string`                                           | -                | HMAC secret used to sign the cookie's data.                                                      |
| `formAsset`            | `string`                                           | -                | Path to the static login form asset served to unauthenticated visitors.                          |
| `byPass`               | `(request: Request) => Promise<boolean>`           | resolves `false` | Called per-request; when it resolves `true`, the session check is skipped entirely.              |
| `login`                | `(request: Request) => Promise<SessionSpec<Data>>` | see source       | Resolves the outcome of a login attempt (`authenticated`, `allowed`, and the `cookie` to issue). |
| `isValid`              | `(data: Data) => boolean`                          | `true`           | Validates the decoded, signature-verified session data on every request.                         |
| `allowInsecureCookies` | `boolean`                                          | `false`          | See [Local development over plain HTTP](#local-development-over-plain-http) below.               |

## Cookie security

Session cookies are always issued with `HttpOnly` set, and by default also with `Secure` set - regardless of the incoming request's scheme. There is no way to opt out of `HttpOnly`.

### Local development over plain HTTP

Browsers refuse to store a cookie marked `Secure` unless it was received over HTTPS. This means that, with the default settings, sessions will not persist when running the plugin under `wrangler pages dev` on plain `http://localhost` (which does not terminate TLS).

To work around this **in local development only**, set `allowInsecureCookies: true` in the plugin arguments. This omits the `Secure` attribute from the session cookie (while still keeping `HttpOnly`), so it can be stored and sent over plain HTTP.

```ts
export default cloudflareAutoSession({
  cookieName: 'session',
  cookieSecret: process.env.COOKIE_SECRET,
  formAsset: '/login/',
  login: myLoginHandler,
  isValid: mySessionValidator,
  // Only ever enable this for local dev - never in production/staging.
  allowInsecureCookies: process.env.NODE_ENV === 'development',
});
```

**Do not set `allowInsecureCookies: true` in production or staging deployments.** Doing so allows the session cookie to be sent over unencrypted connections, exposing it to interception.
