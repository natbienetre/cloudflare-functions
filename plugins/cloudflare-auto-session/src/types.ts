export type CookieData = object;

export interface CookieSpec<Data extends CookieData> {
  data: Data;
  domain?: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
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
