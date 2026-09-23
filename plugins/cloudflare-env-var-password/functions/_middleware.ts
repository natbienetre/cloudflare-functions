import autoSession from '@natbienetre/cloudflare-auto-session';

import type { PluginArgs, CookieData } from '../src/types';
import { Auth } from '../src/authenticator';
import { withDefaults } from '../src/args';
import {
  clearUserDataCookieHeader,
  setUserDataCookieHeader,
  signUserData,
} from '../src/user-data';

function appendSetCookie(response: Response, cookie: string): Response {
  // Append instead of replacing the HttpOnly session cookie emitted by
  // cloudflare-auto-session.
  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', cookie);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const onRequest: PagesPluginFunction<
  Record<string, string | undefined>,
  string,
  Record<string, unknown>,
  PluginArgs
> = async context => {
  const {
    passwordEncodingMethod,
    passwordFieldName,
    getEnvVarName,
    missingPasswordCallback,
    session,
    userDataCookie,
  } = withDefaults(context.pluginArgs);
  const passwordHash = context.env[getEnvVarName(context)];

  if (passwordHash === undefined) {
    console.error(`Password not found for ${context.request.url}`);

    return missingPasswordCallback(context);
  }

  console.debug(`Password found for ${context.request.url} in environment`);

  const auth = new Auth(
    context.request,
    passwordHash,
    passwordEncodingMethod,
    passwordFieldName,
    userDataCookie?.fields
  );

  // This middleware handles GETs as well as login POSTs. Track whether the
  // login callback ran so normal page requests do not rewrite user data.
  let attemptedLogin = false;
  let userDataToken: string | undefined;

  const response = await autoSession<CookieData>({
    ...session,
    isValid: auth.isValid.bind(auth),
    login: async request => {
      attemptedLogin = true;
      const result = await auth.sessionData(request);

      if (result.allowed && userDataCookie !== undefined) {
        // The private key is read only inside the Worker. Clients receive the
        // signed JWS and verify it with the corresponding public key.
        const privateKey = context.env[userDataCookie.privateKeyEnvVarName];
        if (privateKey === undefined) {
          throw new Error(
            `Missing user data signing key: ${userDataCookie.privateKeyEnvVarName}`
          );
        }

        userDataToken = await signUserData(
          result.userData ?? {},
          privateKey,
          userDataCookie
        );
      }

      return result;
    },
  })(context);

  if (!attemptedLogin || userDataCookie === undefined) {
    return response;
  }

  return appendSetCookie(
    response,
    // Clear stale identification data after any unsuccessful login so it
    // cannot outlive the authentication state that produced it.
    userDataToken === undefined
      ? clearUserDataCookieHeader(userDataCookie)
      : setUserDataCookieHeader(userDataToken, userDataCookie)
  );
};
