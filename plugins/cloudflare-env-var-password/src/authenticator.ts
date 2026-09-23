import {
  type SessionSpec,
  type CookieSpec,
} from '@natbienetre/cloudflare-auto-session';

import { extractUserData } from './user-data';
import type { PasswordEncodingMethod, CookieData, UserData } from './types';

// userData is an out-of-band result consumed by the wrapper middleware. It is
// intentionally absent from CookieData, so auto-session never serializes it
// into the HttpOnly cookie used to grant access.
export type AuthSessionSpec = SessionSpec<CookieData> & {
  userData?: UserData;
};

export class Auth {
  readonly passwordEncodingMethod: PasswordEncodingMethod;
  readonly passwordFieldName: string;
  readonly expectedPasswordHash: string;
  readonly userDataFields: readonly string[];
  readonly url: URL;

  constructor(
    request: Request,
    passwordHash: string,
    passwordEncodingMethod: PasswordEncodingMethod,
    passwordFieldName: string,
    userDataFields: readonly string[] = []
  ) {
    this.url = new URL(request.url);
    this.passwordEncodingMethod = passwordEncodingMethod;
    this.passwordFieldName = passwordFieldName;
    this.expectedPasswordHash = passwordHash;
    this.userDataFields = userDataFields;
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

  async sessionData(request: Request): Promise<AuthSessionSpec> {
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

      if (typeof password !== 'string') {
        console.warn('Password must be a string');

        return {
          authenticated: true,
          allowed: false,
          cookie: this.cookieSpec({
            source: 'invalid-password',
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

          return {
            authenticated: true,
            allowed: true,
            // Extraction happens only after the password succeeds and only
            // for fields explicitly selected by the deployment.
            userData:
              this.userDataFields.length === 0
                ? undefined
                : extractUserData(formData, this.userDataFields),
            cookie: this.cookieSpec({
              source: 'user-form',
            }),
          };
        });
    });
  }
}
