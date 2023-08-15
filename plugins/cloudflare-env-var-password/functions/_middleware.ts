import autoSession from '@natbienetre/cloudflare-auto-session'

import type { PluginArgs } from '../src/types'
import { Auth } from '../src/authenticator'
import { withDefaults } from '../src/args'

export const onRequest = (context: EventPluginContext<Record<string, string | undefined>, any, any, PluginArgs>): Response => {
  const { passwordEncodingMethod, passwordFieldName, getEnvVarName } = withDefaults(context.pluginArgs)

  const auth = new Auth(context.request, context.env, getEnvVarName(context), passwordEncodingMethod, passwordFieldName)

  return autoSession({
    secret: context.env.SECRET,
    login: auth.sessionData
  })(context)
}
