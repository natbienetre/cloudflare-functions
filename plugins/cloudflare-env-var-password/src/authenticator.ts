import type { SessionSpec } from '@natbienetre/cloudflare-auto-session'

import type { PasswordEncodingMethod } from './types'

export class Auth {
  env: Record<string, string | undefined>
  passwordEncodingMethod: PasswordEncodingMethod
  passwordFieldName: string
  envVarName: string
  url: URL

  constructor (
    request: Request,
    env: Record<string, string | undefined>,
    envVarName: string,
    passwordEncodingMethod: PasswordEncodingMethod,
    passwordFieldName: string
  ) {
    this.env = env
    this.url = new URL(request.url)
    this.passwordEncodingMethod = passwordEncodingMethod
    this.passwordFieldName = passwordFieldName
    this.envVarName = envVarName

    this.getExpectedPassword = this.getExpectedPassword.bind(this)
    this.sessionData = this.sessionData.bind(this)
    this.isValid = this.isValid.bind(this)
  }

  getExpectedPassword (): string {
    const expected = this.env[this.envVarName]

    if (expected === undefined) {
      throw new Error(`Variable '${this.envVarName}' not found`)
    }

    return expected
  }

  isValid (data: any): boolean {
    return data.path === this.url.pathname
  }

  async sessionData (formData: FormData): Promise<SessionSpec> {
    const expected = this.getExpectedPassword()
    const password = formData.get(this.passwordFieldName)

    if (password === null || password === undefined) {
      return {
        authenticated: false,
        allowed: false
      }
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

    return await hash.then((hash: string): SessionSpec => {
      const passwordMatch = hash === expected

      console.debug(`Password: ${hash} === ${expected}`, passwordMatch)

      if (!passwordMatch) {
        return {
          authenticated: true,
          allowed: passwordMatch
        }
      }

      return {
        authenticated: true,
        allowed: true,
        cookie: {
          data: {
            path: this.url.pathname,
            ...formData.entries()
          },
          path: this.url.pathname
        }
      }
    })
  }
}
