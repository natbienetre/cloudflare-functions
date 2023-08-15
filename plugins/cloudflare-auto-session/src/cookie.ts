import type { CookieSpec } from './types'

export class Cookie {
  spec: CookieSpec

  constructor (spec?: CookieSpec) {
    this.spec = spec ?? {}
  }

  headerSetCookie (name: string, encode: (data?: any) => string): string {
    const value = encode(this.spec.data)

    const cookieParts = [
      name + '=' + value,
      this.spec.domain !== undefined ? 'Domain=' + this.spec.domain : '',
      this.spec.path !== undefined ? 'Path=' + this.spec.path : '',
      this.spec.expires !== undefined ? 'Expires=' + this.spec.expires.toUTCString() : '',
      this.spec.maxAge !== undefined ? 'Max-Age=' + this.spec.maxAge.toString() : '',
      this.spec.secure !== undefined ? 'Secure' : '',
      this.spec.httpOnly !== undefined ? 'HttpOnly' : '',
      this.spec.sameSite !== undefined ? 'SameSite=' + this.spec.sameSite : ''
    ]

    return cookieParts.filter((part) => part !== '').join('; ')
  }
}
