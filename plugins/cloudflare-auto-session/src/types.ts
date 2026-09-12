export type CookieData = object;

export interface CookieSpec<Data extends CookieData> {
  data: Data;
  domain?: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  /** Session cookies are secure by default; `false` is rejected. */
  secure?: boolean;
  /** Session cookies are HTTP-only by default; `false` is rejected. */
  httpOnly?: boolean;
  /** Defaults to `Lax`. */
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface SessionSpec<Data extends CookieData> {
  authenticated: boolean;
  allowed: boolean;
  cookie: CookieSpec<Data>;
}

export interface PluginArgs<Data extends CookieData> {
  cookieName: string;
  cookieSecret: string;
  formAsset: string;
  byPass(request: Request): Promise<boolean>;
  login: (request: Request) => Promise<SessionSpec<Data>>;
  isValid: (session: Data) => boolean;
}
