export type PasswordEncodingMethod = string | SubtleCryptoHashAlgorithm

export interface PluginArgs {
  cookieName?: string
  getEnvVarName?: (context: EventContext<any, any, any>) => string
  passwordEncodingMethod?: PasswordEncodingMethod
  passwordFieldName?: string
}
