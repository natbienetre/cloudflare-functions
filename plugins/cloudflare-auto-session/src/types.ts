export interface CookieSpec {
  data?: any
  domain?: string
  path?: string
  expires?: Date
  maxAge?: number
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

export interface SessionSpec {
  authenticated: boolean
  allowed: boolean
  cookie?: CookieSpec
}

export interface PluginArgs {
  cookieName?: string
  cookieSecret: string
  formAsset: string
  login?: (formdata: FormData) => SessionSpec
}
