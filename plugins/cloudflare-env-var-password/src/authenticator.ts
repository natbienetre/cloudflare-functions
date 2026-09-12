import {
  type SessionSpec,
  type CookieSpec,
} from '@natbienetre/cloudflare-auto-session';

import type { PasswordEncodingMethod, CookieData } from './types';

export class Auth {
  readonly passwordEncodingMethod: PasswordEncodingMethod;
  readonly passwordFieldName: string;
  readonly expectedPasswordHash: string;
  readonly url: URL;

  constructor(
    request: Request,
    passwordHash: string,
    passwordEncodingMethod: PasswordEncodingMethod,
    passwordFieldName: string
  ) {
    this.url = new URL(request.url);
    this.passwordEncodingMethod = passwordEncodingMethod;
    this.passwordFieldName = passwordFieldName;
    this.expectedPasswordHash = passwordHash;
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
      sameSite: 'Lax',
    };
  }

  async sessionData(request: Request): Promise<SessionSpec<CookieData>> {
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
  }
}
