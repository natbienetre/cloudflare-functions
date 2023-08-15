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
   import middleware from "@natbienetre/cloudflare-env-var-password"

   export const onRequest = middleware()
   ```

1. Optional: If you want to protect only a specific path, you can use the [routing feature](https://developers.cloudflare.com/pages/platform/functions/routing/#create-a-_routesjson-file)

1. Create a [secret](https://developers.cloudflare.com/pages/platform/functions/bindings/#secrets) named `PASSWORD` with the password you want to use to protect your website.

1. Deploy your website.

## Parameters

| Name | Type | Description | Default |
| --- | --- | --- |
| `cookieName` | `string` | The name of the cookie to set. | cloudflare-plugin |
| `getEnvVarName` | `(context: EventContext) => string` | A function that return the name of the environment variable that contains the password. | `() => 'PASSWORD'` |
| `passwordEncodingMethod` | `'plain'` | The encoding method of the password. Only plain is supported for now. | `plain` |
| `passwordFieldName` | `string` | The name of the field in the form that contains the password. | `password` |


## Example

```ts
import middleware from '@natbienetre/cloudflare-env-var-password'

export const onRequest = middleware({
  getEnvVarName: (context: EventContext<any, any, any>): string => {
    const url = new URL(context.request.url)
    return 'PASS_' + url.pathname
  }
})
```
