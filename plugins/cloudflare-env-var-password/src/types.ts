import type { GoogleBot } from './google';

export type PasswordEncodingMethod = string | SubtleCryptoHashAlgorithm;

export type Env = {
  [key: string]: string;
};

export interface AllowedBots {
  google: Map<GoogleBot, boolean>;
}

export interface PluginArgs {
  cookieName?: string;
  getEnvVarName?: (context: EventContext<Env, string, unknown>) => string;
  passwordEncodingMethod?: PasswordEncodingMethod;
  passwordFieldName?: string;
  allowedBots: AllowedBots;
}
