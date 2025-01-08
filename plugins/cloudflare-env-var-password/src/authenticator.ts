import type {
  SessionSpec,
  CookieData,
} from '@natbienetre/cloudflare-auto-session';

import type { AllowedBots, PasswordEncodingMethod } from './types';
import { allBots } from './google';

export class Auth {
  readonly passwordEncodingMethod: PasswordEncodingMethod;
  readonly passwordFieldName: string;
  readonly expectedPassword: string;
  readonly url: URL;
  readonly verifiers: Array<(req: Request) => Promise<boolean>>;

  constructor(
    request: Request,
    password: string,
    passwordEncodingMethod: PasswordEncodingMethod,
    passwordFieldName: string,
    allowedBots: AllowedBots
  ) {
    this.url = new URL(request.url);
    this.passwordEncodingMethod = passwordEncodingMethod;
    this.passwordFieldName = passwordFieldName;
    this.expectedPassword = password;
    this.verifiers = [...allowedBots.google]
      .filter(value => value[1])
      .map(
        value =>
          allBots.get(value[0]) ??
          (async (_: Request): Promise<boolean> => false)
      );

    this.verify = this.verify.bind(this);
    this.sessionData = this.sessionData.bind(this);
    this.isValid = this.isValid.bind(this);
    this.expectedPasswordHash = this.expectedPasswordHash.bind(this);
  }

  async verify(req: Request): Promise<boolean> {
    return this.verifiers
      .map(verif => verif(req))
      .reduce(
        async (acc, curr) => (await acc) || (await curr),
        Promise.resolve(false)
      );
  }

  isValid(data: CookieData): boolean {
    return data.path === this.url.pathname;
  }

  async expectedPasswordHash(): Promise<string> {
    return this.passwordEncodingMethod === undefined
      ? this.expectedPassword
      : crypto.subtle
          .digest(
            this.passwordEncodingMethod,
            new TextEncoder().encode(this.expectedPassword)
          )
          .then(hash => btoa(String.fromCharCode(...new Uint8Array(hash))));
  }

  async sessionData(request: Request): Promise<SessionSpec> {
    this.verify(request).then(verified => {
      if (verified) {
        console.info('Trusted bot detected');
        return {
          authenticated: true,
          allowed: true,
        };
      }

      return request.formData().then(async formData => {
        const password = formData.get(this.passwordFieldName);

        if (password === null || password === undefined) {
          console.info('No password provided');
          return {
            authenticated: false,
            allowed: false,
          };
        }

        return this.expectedPasswordHash()
          .then(hash => hash === this.expectedPassword)
          .then(passwordMatch => {
            if (!passwordMatch) {
              console.info('Password mismatch');

              return {
                authenticated: true,
                allowed: passwordMatch,
              };
            }

            console.info('Password match');

            return {
              authenticated: true,
              allowed: true,
              cookie: {
                data: {
                  path: this.url.pathname,
                  ...formData.entries(),
                },
                path: this.url.pathname,
              },
            };
          });
      });
    });
  }
}
