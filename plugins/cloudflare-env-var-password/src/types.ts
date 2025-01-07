import type { GoogleBot } from './google'

export type PasswordEncodingMethod = string | SubtleCryptoHashAlgorithm

export interface AllowedBots {
  google: Map<GoogleBot, boolean>
}

export interface PluginArgs {
  cookieName?: string
  getEnvVarName?: (context: EventContext<any, any, any>) => string
  passwordEncodingMethod?: PasswordEncodingMethod
  passwordFieldName?: string
  allowedBots: AllowedBots
}
