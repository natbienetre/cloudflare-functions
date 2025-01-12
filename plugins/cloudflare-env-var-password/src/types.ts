import type { CookieData as UntypedCookieData } from '@natbienetre/cloudflare-auto-session';
import type { GoogleBot } from './google';

export type CookieData = UntypedCookieData & {
  path: string;
  source: string;
  userData?: FormData;
};

export type PasswordEncodingMethod =
  | string
  | SubtleCryptoHashAlgorithm
  | undefined;

export interface AllowedBots {
  google: Map<GoogleBot, boolean>;
}

export class AutoSessionArgs {
  cookieName?: string;
  cookieSecret?: string;
  formAsset?: string;
}

export interface PluginArgs {
  session: AutoSessionArgs;

  getEnvVarName: (
    context: EventContext<
      Record<string, string | undefined>,
      string,
      Record<string, unknown>
    >
  ) => string;
  passwordEncodingMethod: PasswordEncodingMethod;
  passwordFieldName: string;
  allowedBots: AllowedBots;
}
