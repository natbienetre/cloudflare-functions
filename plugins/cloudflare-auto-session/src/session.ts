import { parse } from 'cookie'
import HmacSHA256 from 'crypto-js/hmac-sha256'

import { Cookie } from './cookie'
import type { CookieSpec } from './types'

export class Session {
  name: string
  secret: string
  isValid: (data: any) => boolean

  constructor (name: string, secret: string, isValid: (data: any) => boolean) {
    if (name === '') {
      throw new Error('Cookie name must be provided')
    }
    if (secret === '') {
      throw new Error('Cookie secret must be provided')
    }

    this.name = name
    this.secret = secret
    this.isValid = isValid
  }

  valid (request: Request): boolean {
    const cookieHeader = request.headers?.get('Cookie')
    if (cookieHeader === null) {
      return false
    }

    const cookies = parse(cookieHeader)

    const cookie = cookies[this.name]
    if (cookie === undefined) {
      console.debug(`Cookie ${this.name} not found`)

      return false
    }

    const parts = cookie.split('.')

    if (parts.length !== 2) {
      return false
    }

    const data = atob(parts[0])

    const signature = HmacSHA256(data, this.secret)

    if (parts[1] !== btoa(signature)) {
      return false
    }

    return this.isValid(JSON.parse(data))
  }

  start (request: Request, cookieSpec?: CookieSpec): Response {
    const cookie = new Cookie(cookieSpec)

    const setCookieHeader = cookie.headerSetCookie(this.name, (data: any): string => {
      const dataString = JSON.stringify(data)
      const signature = HmacSHA256(dataString, this.secret)

      return btoa(dataString) + '.' + btoa(signature)
    })

    return new Response('', {
      status: 302,
      headers: {
        Location: request.url,
        'Set-Cookie': setCookieHeader
      }
    })
  }

  end (_: Request): Response {
    throw new Error('Not implemented')
  }
}
