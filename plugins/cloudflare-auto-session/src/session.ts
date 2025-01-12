import { parse } from 'cookie';
import { createHmac } from 'node:crypto';

import { Cookie } from './cookie';
import type { CookieSpec, CookieData, PluginArgs } from './types';

const signatureAlgorithm = 'sha256';
const signatureEncoding = 'hex'; // 'base64' is also an option
const dataSeparator = '.';

export class Session<Data extends CookieData> {
  readonly cookieName: string;
  readonly cookieSecret: string;
  readonly isValid: (data: Data) => boolean;

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

    this.cookieName = cookieName;
    this.cookieSecret = cookieSecret;
    this.isValid = isValid;
  }

  getCookie(request: Request): string | undefined {
    const cookieHeader = request.headers?.get('Cookie');
    if (cookieHeader === null) {
      return undefined;
    }

    const cookies = parse(cookieHeader);

    return cookies[this.cookieName];
  }

  valid(cookieString: string): boolean {
    const [encodedData, encodedSignature] = cookieString.split(
      dataSeparator,
      2
    );

    const data = this.decodeData(encodedData);

    console.debug('Checking cookie', this.cookieName, data);

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
    const data = JSON.parse(atob(dataString));

    if (typeof data !== 'object') {
      return undefined;
    }

    return data;
  }

  private getSignature(data: CookieData): string {
    return createHmac(signatureAlgorithm, this.cookieSecret)
      .update(JSON.stringify(data))
      .digest(signatureEncoding);
  }

  start(request: Request, cookieSpec: CookieSpec<Data>): Response {
    const cookie = new Cookie(cookieSpec);

    return new Response(`Logged in`, {
      status: 302,
      headers: {
        Location: request.url,
        'Set-Cookie': cookie.setCookieHeader(
          this.cookieName,
          (data: Data): string =>
            `${this.encodeData(data)}${dataSeparator}${this.getSignature(data)}`
        ),
      },
    });
  }

  end(response: Response): Response {
    response.headers.append(
      'Set-Cookie',
      `${this.cookieName}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`
    );
    return response;
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

    console.debug('Redirecting to login form', url.toString());

    return env.ASSETS.fetch(new Request(url, request));
  };
};
