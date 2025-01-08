import { parse } from 'cookie';
import { createHmac } from 'node:crypto';

import { Cookie } from './cookie';
import type { CookieSpec, CookieData } from './types';

export class Session {
  name: string;
  secret: string;
  isValid: (data: CookieData) => boolean;

  constructor(
    cookieName: string,
    cookieSecret: string,
    isValid: (data: CookieData) => boolean
  ) {
    if (cookieName === '') {
      throw new Error('Cookie name must be provided');
    }
    if (cookieSecret === '') {
      throw new Error('Cookie secret must be provided');
    }

    this.name = cookieName;
    this.secret = cookieSecret;
    this.isValid = isValid;
  }

  valid(request: Request): boolean {
    const cookieHeader = request.headers?.get('Cookie');
    if (cookieHeader === null) {
      return false;
    }

    const cookies = parse(cookieHeader);

    const cookie = cookies[this.name];
    if (cookie === undefined) {
      console.debug(`Cookie ${this.name} not found`);

      return false;
    }

    const parts = cookie.split('.');

    if (parts.length !== 2) {
      return false;
    }

    const data = atob(parts[0]);

    const signature = createHmac('sha256', this.secret)
      .update(data)
      .digest('base64');

    if (parts[1] !== btoa(signature)) {
      return false;
    }

    return this.isValid(JSON.parse(data));
  }

  start(request: Request, cookieSpec?: CookieSpec): Response {
    const cookie = new Cookie(cookieSpec);

    const setCookieHeader = cookie.headerSetCookie(
      this.name,
      (data?: CookieData): string => {
        const dataString = JSON.stringify(data);
        const signature = createHmac('sha256', this.secret)
          .update(data)
          .digest('base64');

        return btoa(dataString) + '.' + btoa(signature);
      }
    );

    return new Response('', {
      status: 302,
      headers: {
        Location: request.url,
        'Set-Cookie': setCookieHeader,
      },
    });
  }

  end(_: Request): Response {
    throw new Error('Not implemented');
  }
}
