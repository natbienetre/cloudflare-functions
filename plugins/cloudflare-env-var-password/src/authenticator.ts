import type {
  SessionSpec,
  CookieData,
} from '@natbienetre/cloudflare-auto-session';

import type { AllowedBots, PasswordEncodingMethod } from './types';
import { allBots } from './google';

export class Auth {
  env: Record<string, string | undefined>;
  passwordEncodingMethod: PasswordEncodingMethod;
  passwordFieldName: string;
  envVarName: string;
  url: URL;

  verifiers: Array<(req: Request) => boolean>;

  constructor(
    request: Request,
    env: Record<string, string | undefined>,
    envVarName: string,
    passwordEncodingMethod: PasswordEncodingMethod,
    passwordFieldName: string,
    allowedBots: AllowedBots
  ) {
    this.env = env;
    this.url = new URL(request.url);
    this.passwordEncodingMethod = passwordEncodingMethod;
    this.passwordFieldName = passwordFieldName;
    this.envVarName = envVarName;

    this.verifiers = [...allowedBots.google]
      .filter(value => value[1])
      .map(value => allBots.get(value[0]) ?? ((_: Request): boolean => false));

    this.getExpectedPassword = this.getExpectedPassword.bind(this);
    this.verify = this.verify.bind(this);
    this.sessionData = this.sessionData.bind(this);
    this.isValid = this.isValid.bind(this);
  }

  verify(req: Request): boolean {
    return this.verifiers.some(verif => verif(req));
  }

  getExpectedPassword(): string {
    const expected = this.env[this.envVarName];

    if (expected === undefined) {
      throw new Error(`Variable '${this.envVarName}' not found`);
    }

    return expected;
  }

  isValid(data: CookieData): boolean {
    return data.path === this.url.pathname;
  }

  async sessionData(request: Request): Promise<SessionSpec> {
    if (this.verify(request)) {
      return {
        authenticated: true,
        allowed: true,
      };
    }

    const expected = this.getExpectedPassword();

    return await request.formData().then(async formData => {
      const password = formData.get(this.passwordFieldName);

      if (password === null || password === undefined) {
        return {
          authenticated: false,
          allowed: false,
        };
      }

      formData.delete(this.passwordFieldName);

      let hash: Promise<string | null>;

      switch (this.passwordEncodingMethod) {
        case '':
          hash = Promise.resolve(password);
          break;
        default:
          hash = crypto.subtle
            .digest(
              this.passwordEncodingMethod,
              new TextEncoder().encode(password)
            )
            .then(hash => {
              return btoa(String.fromCharCode(...new Uint8Array(hash)));
            });
      }

      return await hash.then((hash: string): SessionSpec => {
        const passwordMatch = hash === expected;

        if (!passwordMatch) {
          return {
            authenticated: true,
            allowed: passwordMatch,
          };
        }

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
  }
}
