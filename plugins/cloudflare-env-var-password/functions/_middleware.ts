import autoSession from '@natbienetre/cloudflare-auto-session';

import type { PluginArgs, CookieData } from '../src/types';
import { Auth } from '../src/authenticator';
import { withDefaults } from '../src/args';

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
    allowedBots,
  } = withDefaults(context.pluginArgs);
  const passwordHash = context.env[getEnvVarName(context)];

  if (passwordHash === undefined) {
    console.error(`Password not found for ${context.request.url}`);

    return missingPasswordCallback(context);
  }

  console.debug(`Password found for ${context.request.url}`);

  const auth = new Auth(
    context.request,
    passwordHash,
    passwordEncodingMethod,
    passwordFieldName,
    allowedBots
  );

  return autoSession<CookieData>({
    ...session,
    isValid: auth.isValid.bind(auth),
    login: auth.sessionData.bind(auth),
  })(context);
};
