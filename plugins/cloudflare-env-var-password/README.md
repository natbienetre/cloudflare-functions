# Env Var Password

## Description

This plugin will help you to secure your static website with environment variables.

## Installation

1. Create the login form `login.html` in your website. Do not set action attribute, so the browser will use the current url.

   ```html
   <form action="" method="POST" encode="application/x-www-form-urlencoded">
     <input type="password" name="password" />
     <input type="submit" value="Login" />
   </form>
   ```

1. Install the plugin:

   ```console
   yarn add @natbienetre/cloudflare-env-var-password
   ```

1. Create the function that use the middleware.

   ```ts
   import middleware from '@natbienetre/cloudflare-env-var-password';

   export const onRequest = middleware();
   ```

1. Optional: If you want to protect only a specific path, you can use the [routing feature](https://developers.cloudflare.com/pages/platform/functions/routing/#create-a-_routesjson-file)

1. Create a [secret](https://developers.cloudflare.com/pages/platform/functions/bindings/#secrets) named `PASSWORD` with the password you want to use to protect your website.

1. Deploy your website.

## Parameters

| Name                     | Type                                | Description                                                                             | Default            |
| ------------------------ | ----------------------------------- | --------------------------------------------------------------------------------------- | ------------------ |
| `cookieName`             | `string`                            | The name of the cookie to set.                                                          | cloudflare-plugin  |
| `getEnvVarName`          | `(context: EventContext) => string` | A function that return the name of the environment variable that contains the password. | `() => 'PASSWORD'` |
| `passwordEncodingMethod` | `'plain'`                           | The encoding method of the password. Only plain is supported for now.                   | `plain`            |
| `passwordFieldName`      | `string`                            | The name of the field in the form that contains the password.                           | `password`         |
| `userDataCookie`         | `UserDataCookieArgs`                | Opt in to a readable, signed cookie containing selected identification fields.          | disabled           |

## Browser-readable identification data

The authentication cookie remains `HttpOnly` and is the only cookie used to
grant access. If both Worker code and browser JavaScript need identification
data submitted with the login form, opt in to a separate ES256-signed JWS
cookie:

```ts
import middleware from '@natbienetre/cloudflare-env-var-password';

export const onRequest = middleware({
  userDataCookie: {
    fields: ['displayName', 'group'],
    privateKeyEnvVarName: 'USER_DATA_PRIVATE_KEY',
    cookieName: '__Host-cloudflare-user-data',
    maxAge: 3600,
  },
});
```

Generate a P-256 key pair and store only the private key as a Cloudflare
secret. The private key must be unencrypted PKCS#8 PEM (it begins with
`-----BEGIN PRIVATE KEY-----`):

```console
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out user-data-private.pem
openssl pkey -in user-data-private.pem -pubout -out user-data-public.pem
npx wrangler pages secret put USER_DATA_PRIVATE_KEY
```

The cookie payload has this shape:

```json
{
  "iat": 1700000000,
  "exp": 1700003600,
  "userData": {
    "displayName": ["Alice"],
    "group": ["members"]
  }
}
```

Browser code can verify and decode the JWS with the public key. For example,
using the `jose` package:

```js
import { importSPKI, jwtVerify } from 'jose';

const token = document.cookie
  .split('; ')
  .find(cookie => cookie.startsWith('__Host-cloudflare-user-data='))
  ?.split('=', 2)[1];

if (token !== undefined) {
  const publicKey = await importSPKI(PUBLIC_KEY_PEM, 'ES256');
  const { payload } = await jwtVerify(token, publicKey, {
    algorithms: ['ES256'],
  });
  const displayName = payload.userData?.displayName?.[0];

  if (typeof displayName === 'string') {
    document.querySelector('#display-name')!.textContent = displayName;
  }
}
```

The same cookie is sent to Worker/server code and can be verified there with
the public key. No server-side session storage is required.

Only configured fields are included. At most 16 fields, eight values per
field, and 256 characters per value are accepted; the JSON payload is capped
at 2 KiB before signing. The password field can never be included. A failed
login clears the identification cookie. Because the JWS is readable rather
than encrypted, do not put secrets or sensitive personal data in it.

The submitted values remain user assertions: a valid signature proves that
the Worker accepted and signed them, not that they are authoritative. Never
use `userData` for authorization. Treat values as untrusted at their eventual
sink and use safe DOM APIs such as `textContent`, never `innerHTML`.

## Example

```ts
import middleware from '@natbienetre/cloudflare-env-var-password';

export const onRequest = middleware({
  getEnvVarName: (context: EventContext<any, any, any>): string => {
    const url = new URL(context.request.url);
    return 'PASS_' + url.pathname;
  },
});
```
