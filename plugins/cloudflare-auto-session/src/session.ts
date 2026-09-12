import { parse } from 'cookie';
import { createHmac } from 'node:crypto';

import { Cookie } from './cookie';
import type { CookieSpec, CookieData, PluginArgs } from './types';

const signatureAlgorithm = 'sha256';
const signatureEncoding = 'hex'; // 'base64' is also an option
const dataSeparator = '.';

export class Session<Data extends CookieData> {
  readonly cookieSecret: string;
  readonly isValid: (data: Data) => boolean;
  readonly cookie: Cookie;

  constructor(
    cookieName: string,
    cookieSecret: string,
    isValid: (data: Data) => boolean
  ) {
    if (cookieName === '') {
      throw new Error('Cookie name must be provided');
    }
    if (cookieSecret === '') {
      throw new Error('Cookie secret must be provided');
    }

    this.cookie = new Cookie(cookieName);
    this.cookieSecret = cookieSecret;
    this.isValid = isValid;
  }

  getCookie(request: Request): string | undefined {
    const cookieHeader = request.headers?.get('Cookie');
    if (cookieHeader === null) {
      return undefined;
    }

    const cookies = parse(cookieHeader);

    return cookies[this.cookie.name];
  }

  valid(cookieString: string): boolean {
    const [encodedData, encodedSignature] = cookieString.split(
      dataSeparator,
      2
    );

    const data = this.decodeData(encodedData);

    console.debug('Checking cookie', this.cookie.name, data);

    if (data === undefined) {
      console.warn(`Invalid data.`);

      return false;
    }

    if (encodedSignature !== this.getSignature(data)) {
      console.warn(`Invalid signature for cookie`);

      return false;
    }

    return this.isValid(data);
  }

  private encodeData(data: Data): string {
    return btoa(JSON.stringify(data));
  }

  private decodeData(dataString: string): Data | undefined {
    try {
      const data = JSON.parse(atob(dataString));

      if (typeof data !== 'object') {
        console.warn('Cookie data is not an object', data);
        return undefined;
      }

      return data;
    } catch (e) {
      console.error('Error parsing cookie data', e);
      return undefined;
    }
  }

  private getSignature(data: CookieData): string {
    return createHmac(signatureAlgorithm, this.cookieSecret)
      .update(JSON.stringify(data))
      .digest(signatureEncoding);
  }

  start(request: Request, cookieSpec: CookieSpec<Data>): Response {
    if (cookieSpec.secure === false || cookieSpec.httpOnly === false) {
      throw new Error('Session cookies must be Secure and HttpOnly');
    }

    return new Response(`Logged in`, {
      status: 302,
      headers: {
        Location: request.url,
        'Set-Cookie': this.cookie.setCookieHeader(
          `${this.encodeData(cookieSpec.data)}${dataSeparator}${this.getSignature(cookieSpec.data)}`,
          cookieSpec.domain,
          cookieSpec.path,
          cookieSpec.expires,
          cookieSpec.maxAge,
          true,
          true,
          cookieSpec.sameSite ?? 'Lax'
        ),
      },
    });
  }

  end(response: Response): Response {
    const newHeaders = new Headers(response.headers);
    newHeaders.append('Set-Cookie', this.cookie.setCookieHeader());
    return new Response(response.body, {
      ...response,
      headers: newHeaders,
    });
  }
}

export const serveForm = (
  assetPath: string
): (({
  request,
  env,
  pluginArgs,
  next,
}: EventPluginContext<
  unknown,
  string,
  Record<string, unknown>,
  PluginArgs<CookieData>
>) => Promise<Response>) => {
  return async ({ request, env }): Promise<Response> => {
    const url = new URL(request.url);

    url.pathname = assetPath;

    console.info('Serving the login form', url.toString());

    return env.ASSETS.fetch(new Request(url, request));
  };
};
