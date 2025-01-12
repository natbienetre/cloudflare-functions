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
    console.debug(`Checking if ${req.url} is a trusted bot`);
    return this.verifiers
      .map(verif => verif(req))
      .reduce(
        async (acc, curr) => (await acc) || (await curr),
        Promise.resolve(false)
      );
  }

  isValid(data?: CookieData): boolean {
    if (data === undefined) {
      console.debug('No data provided');
      return false;
    }

    console.debug(`Checking if ${data.path} is ${this.url.pathname}`);
    return data.path === this.url.pathname;
  }

  async expectedPasswordHash(): Promise<string> {
    console.debug(`Computing hash for ${this.expectedPassword}`);
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

        if (password === null) {
          console.info('No password provided');
          return {
            authenticated: false,
            allowed: false,
          };
        }

        formData.delete(this.passwordFieldName);

        return this.expectedPasswordHash()
          .then(expectedPassword => expectedPassword === password)
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
