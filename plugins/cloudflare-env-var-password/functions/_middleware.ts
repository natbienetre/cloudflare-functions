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

  let attemptedLogin = false;
  let userDataToken: string | undefined;

  const response = await autoSession<CookieData>({
    ...session,
    isValid: auth.isValid.bind(auth),
    login: async request => {
      attemptedLogin = true;
      const result = await auth.sessionData(request);

      if (result.allowed && userDataCookie !== undefined) {
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
    userDataToken === undefined
      ? clearUserDataCookieHeader(userDataCookie)
      : setUserDataCookieHeader(userDataToken, userDataCookie)
  );
};
