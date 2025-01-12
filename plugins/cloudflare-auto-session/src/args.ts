import type { PluginArgs, SessionSpec, CookieData } from './types';

export interface PluginArgsWithDefaults<Data extends CookieData> {
  cookieName: string;
  cookieSecret: string;
  formAsset: string;
  login: (request: Request) => Promise<SessionSpec<Data>>;
  isValid: (data: Data) => boolean;
}

const Defaults = {
  cookieName: 'cloudflare-auto-session',
  cookieSecret: 'secret',
  login: async (request: Request): Promise<SessionSpec<CookieData>> => {
    const url = new URL(request.url);
    return {
      authenticated: false,
      allowed: false,
      cookie: {
        path: url.pathname,
        domain: url.hostname,
        secure: url.protocol === 'https:',
        httpOnly: true,
        sameSite: 'Lax',
        data: {},
      },
    };
  },
  formAsset: '/nbe-login/',
  isValid: (_: CookieData): boolean => true,
};

export function withDefaults<Data extends CookieData>(
  args: PluginArgs<Data>
): PluginArgsWithDefaults<Data> {
  return {
    ...Defaults,
    ...args,
  } as PluginArgsWithDefaults<Data>;
}
