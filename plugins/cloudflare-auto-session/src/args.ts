import type { PluginArgs, SessionSpec } from './types'

export interface PluginArgsWithDefaults {
  cookieName: string
  cookieSecret: string
  formAsset: string
  login: (formdata: FormData) => SessionSpec
  isValid: (data: any) => boolean
}

const Defaults = {
  cookieName: 'cloudflare-plugin',
  cookieSecret: 'secret',
  login: (_: FormData): SessionSpec => {
    return {
      authenticated: false,
      allowed: false
    }
  },
  formAsset: 'nbe-login',
  isValid: (_: any): boolean => true
}

export function withDefaults (args: PluginArgs): PluginArgsWithDefaults {
  return {
    ...Defaults,
    ...args
  }
}
