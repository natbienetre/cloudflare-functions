import type { PluginArgs, PasswordEncodingMethod } from './types'

export interface PluginArgsWithDefaults {
  cookieName: string
  getEnvVarName: (_: EventContext<any, any, any>) => string
  passwordEncodingMethod: PasswordEncodingMethod
  passwordFieldName: string
}

export const Defaults = {
  cookieName: 'cloudflare-plugin',
  getEnvVarName: (_: EventContext<any, any, any>): string => 'CREDENTIALS',
  passwordEncodingMethod: '',
  passwordFieldName: 'password'
}

export function withDefaults (args: PluginArgs): PluginArgsWithDefaults {
  return {
    ...Defaults,
    ...args
  }
}
