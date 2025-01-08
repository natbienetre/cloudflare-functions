import type {
  SessionSpec,
  CookieData,
} from '@natbienetre/cloudflare-auto-session';
import type { GoogleBot } from './google';

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
  login?: (request: Request) => Promise<SessionSpec>;
  isValid?: (session: CookieData) => boolean;
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
