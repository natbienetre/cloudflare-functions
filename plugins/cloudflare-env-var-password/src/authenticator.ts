import type { SessionSpec } from '@natbienetre/cloudflare-auto-session'
import type { PluginArgs, PasswordEncodingMethod } from './types'

export class Auth {
  context: EventPluginContext<any, any, any, PluginArgs>
  passwordEncodingMethod: PasswordEncodingMethod
  passwordFieldName: string
  getEnvVarName: (context: EventContext<any, any, any>) => string

  constructor (
    context: EventPluginContext<any, any, any, PluginArgs>,
    getEnvVarName: (context: EventContext<any, any, any>) => string,
    passwordEncodingMethod: PasswordEncodingMethod,
    passwordFieldName: string
  ) {
    this.context = context
    this.passwordEncodingMethod = passwordEncodingMethod
    this.passwordFieldName = passwordFieldName
    this.getEnvVarName = getEnvVarName

    this.getExpectedPassword = this.getExpectedPassword.bind(this)
    this.sessionData = this.sessionData.bind(this)
  }

  getExpectedPassword (): string {
    const envVarName = (this.getEnvVarName)(this.context)
    const expected = this.context?.env[envVarName]

    if (expected === undefined || expected === null || expected === '') {
      throw new Error(`Variable '${envVarName}' not found`)
    }

    return expected
  }

  async sessionData (formData: FormData): Promise<SessionSpec> {
    const expected = this.getExpectedPassword()

    const password = formData.get(this.passwordFieldName)

    if (password === null || password === undefined) {
      throw new Error(`Password field '${this.passwordFieldName}' not found`)
    }

    formData.delete(this.passwordFieldName)

    let hash: Promise<string | null>

    switch (this.passwordEncodingMethod) {
      case '':
        hash = Promise.resolve(password)
        break
      default:
        hash = crypto.subtle.digest(this.passwordEncodingMethod, new TextEncoder().encode(password)).then((hash) => {
          return btoa(String.fromCharCode(...new Uint8Array(hash)))
        })
    }
    return await hash.then((hash: string) => {
      console.debug(`Password: ${hash} === ${password}`, hash === password)

      if (hash !== expected) {
        return {
          authenticated: false,
          allowed: false
        }
      }

      return {
        authenticated: true,
        allowed: true,
        cookie: {
          data: {
            username: formData.get('username')
          }
        }
      }
    })
  }
}
