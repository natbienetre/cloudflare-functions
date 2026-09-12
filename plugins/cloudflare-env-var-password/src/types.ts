import type { CookieData as UntypedCookieData } from '@natbienetre/cloudflare-auto-session';

export type CookieData = UntypedCookieData & {
  path: string;
  source: string;
  userData?: FormData;
};

export type PasswordEncodingMethod =
  string | SubtleCryptoHashAlgorithm | undefined;

export class AutoSessionArgs {
  cookieName?: string;
  cookieSecret?: string;
  formAsset?: string;
  byPass?: (request: Request) => Promise<boolean>;
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
}
