import autoSession from '@natbienetre/cloudflare-auto-session';

import type { PluginArgs } from '../src/types';
import { Auth } from '../src/authenticator';
import { withDefaults } from '../src/args';

export const onRequest: PagesPluginFunction<
  Record<string, string | undefined>,
  string,
  Record<string, unknown>,
  PluginArgs
> = async context => {
  const { env } = context;

  const {
    passwordEncodingMethod,
    passwordFieldName,
    getEnvVarName,
    missingPasswordCallback,
    session,
    allowedBots,
  } = withDefaults(context.pluginArgs);
  const password = env[getEnvVarName(context)];

  if (password === undefined) {
    console.error(`Password not found for ${context.request.url}`);

    return missingPasswordCallback(context);
  }

  console.debug(`Password found for ${context.request.url}`);

  const auth = new Auth(
    context.request,
    password,
    passwordEncodingMethod,
    passwordFieldName,
    allowedBots
  );

  session.isValid = auth.isValid;
  session.login = auth.sessionData;

  return autoSession(session)(context);
};
