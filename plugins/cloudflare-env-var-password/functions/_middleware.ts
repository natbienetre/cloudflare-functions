import autoSession from '@natbienetre/cloudflare-auto-session';

import type { PluginArgs, Env } from '../src/types';
import { Auth } from '../src/authenticator';
import { withDefaults } from '../src/args';

export const onRequest = (
  context: EventPluginContext<Env, any, any, PluginArgs>
): Response | Promise<Response> => {
  const {
    passwordEncodingMethod,
    passwordFieldName,
    getEnvVarName,
    allowedBots,
  } = withDefaults(context.pluginArgs);
  const auth = new Auth(
    context.request,
    context.env,
    getEnvVarName(context),
    passwordEncodingMethod,
    passwordFieldName,
    allowedBots
  );

  return autoSession({
    secret: context.env.SECRET,
    login: auth.sessionData,
    isValid: auth.isValid,
  })(context);
};
