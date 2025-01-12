import {
  type SessionSpec,
  type CookieSpec,
} from '@natbienetre/cloudflare-auto-session';

import type { AllowedBots, PasswordEncodingMethod, CookieData } from './types';
import { allBots } from './google';

export class Auth {
  readonly passwordEncodingMethod: PasswordEncodingMethod;
  readonly passwordFieldName: string;
  readonly expectedPasswordHash: string;
  readonly url: URL;
  readonly verifiers: Array<(req: Request) => Promise<boolean>>;

  constructor(
    request: Request,
    passwordHash: string,
    passwordEncodingMethod: PasswordEncodingMethod,
    passwordFieldName: string,
    allowedBots: AllowedBots
  ) {
    this.url = new URL(request.url);
    this.passwordEncodingMethod = passwordEncodingMethod;
    this.passwordFieldName = passwordFieldName;
    this.expectedPasswordHash = passwordHash;
    this.verifiers = [...allowedBots.google]
      .filter(value => value[1])
      .map(
        value =>
          allBots.get(value[0]) ??
          (async (_: Request): Promise<boolean> => false)
      );
  }

  async verify(req: Request): Promise<boolean> {
    console.debug('Checking if client is a trusted bot', req.cf?.botManagement);
    return this.verifiers
      .map(verif => verif(req))
      .reduce(
        async (acc, curr) => (await acc) || (await curr),
        Promise.resolve(false)
      );
  }

  isValid(data: CookieData): boolean {
    console.debug('Checking if data is valid for the current request', data);
    return this.url.pathname.startsWith(data.path);
  }

  async hashPassword(password: string): Promise<string> {
    console.debug('Hashing password with method', this.passwordEncodingMethod);
    return this.passwordEncodingMethod === undefined
      ? password
      : crypto.subtle
          .digest(
            this.passwordEncodingMethod,
            new TextEncoder().encode(password)
          )
          .then(hash => btoa(String.fromCharCode(...new Uint8Array(hash))));
  }

  private cookieSpec(
    data: CookieData & { path?: string }
  ): CookieSpec<CookieData> {
    data.path = this.url.pathname;

    return {
      data: data,
      path: this.url.pathname,
      domain: this.url.hostname,
      secure: this.url.protocol === 'https:',
      httpOnly: true,
      sameSite: 'Lax',
    };
  }

  async sessionData(request: Request): Promise<SessionSpec<CookieData>> {
    return this.verify(request).then(verified => {
      if (verified) {
        console.info('Trusted bot detected');

        return {
          authenticated: true,
          allowed: true,
          cookie: this.cookieSpec({
            source: 'trusted-bot',
          }),
        };
      }

      return request.formData().then(async formData => {
        const password = formData.get(this.passwordFieldName);

        if (password === null) {
          console.warn('No password provided');

          return {
            authenticated: false,
            allowed: false,
            cookie: this.cookieSpec({
              source: 'no-password',
            }),
          };
        }

        return this.hashPassword(password)
          .then(hashedPassword => this.expectedPasswordHash === hashedPassword)
          .then(passwordMatch => {
            if (!passwordMatch) {
              console.warn(
                `Password mismatch, expected ${this.expectedPasswordHash}`
              );

              return {
                authenticated: true,
                allowed: false,
                cookie: this.cookieSpec({
                  source: 'invalid-password',
                }),
              };
            }

            console.info('Password match');

            // Remove the password from the form data
            // before storing it in the cookie
            formData.delete(this.passwordFieldName);

            return {
              authenticated: true,
              allowed: true,
              cookie: this.cookieSpec({
                source: 'user-form',
                userData: formData,
              }),
            };
          });
      });
    });
  }
}
