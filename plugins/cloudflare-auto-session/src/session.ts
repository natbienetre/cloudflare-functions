import { parse } from 'cookie';
import { createHmac } from 'node:crypto';

import { Cookie } from './cookie';
import type { CookieSpec, CookieData } from './types';

const signatureAlgorithm = 'sha256';
const signatureEncoding = 'hex'; // 'base64' is also an option
const dataSeparator = '.';

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

    const [encodedData, encodedSignature] = cookie.split(dataSeparator, 2);

    const data = this.decodeData(encodedData) || {};

    console.debug(`Checking cookie ${this.name} with data ${data}`);

    if (encodedSignature !== this.getSignature(data)) {
      console.warn(`Invalid signature for cookie ${this.name}`);

      return false;
    }

    return this.isValid(data);
  }

  encodeData(data: CookieData): string {
    return btoa(JSON.stringify(data));
  }

  decodeData(dataString: string): CookieData | undefined {
    const data = JSON.parse(atob(dataString));

    if (typeof data !== 'object') {
      return undefined;
    }

    return data;
  }

  getSignature(data: CookieData): string {
    return createHmac(signatureAlgorithm, this.secret)
      .update(data)
      .digest(signatureEncoding);
  }

  start(request: Request, cookieSpec?: CookieSpec): Response {
    if (cookieSpec === undefined) {
      cookieSpec = {
        data: {
          path: new URL(request.url).pathname,
        },
      };
    }

    const cookie = new Cookie(cookieSpec);

    const setCookieHeader = cookie.headerSetCookie(
      this.name,
      (data: CookieData): string => {
        return `${this.encodeData(data)}${dataSeparator}${this.getSignature(data)}`;
      }
    );

    return new Response(`Logged in`, {
      status: 302,
      headers: {
        Location: request.url,
        'Set-Cookie': setCookieHeader,
      },
    });
  }

  end(request: Request): Response {
    return new Response(`Logged in`, {
      status: 302,
      headers: {
        Location: request.url,
        'Set-Cookie': `${this.name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`,
      },
    });
  }
}
