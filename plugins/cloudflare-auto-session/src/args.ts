import type { CookieData } from './cookie';
import type { PluginArgs, SessionSpec } from './types';

export interface PluginArgsWithDefaults {
  cookieName: string;
  cookieSecret: string;
  formAsset: string;
  login: (request: Request) => Promise<SessionSpec>;
  isValid: (data: CookieData) => boolean;
}

const Defaults = {
  cookieName: 'cloudflare-plugin',
  cookieSecret: 'secret',
  login: async (_: Request): Promise<SessionSpec> => {
    return {
      authenticated: false,
      allowed: false,
    };
  },
  formAsset: '/nbe-login/',
  isValid: (_: CookieData): boolean => true,
};

export function withDefaults(args: PluginArgs): PluginArgsWithDefaults {
  return {
    ...Defaults,
    ...args,
  };
}
