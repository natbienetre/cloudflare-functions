import type { CookieData as UntypedCookieData } from '@natbienetre/cloudflare-auto-session';

export type CookieData = UntypedCookieData & {
  path: string;
  source: string;
};

export type UserData = Record<string, string[]>;

export interface UserDataCookieArgs {
  /** Form fields to include. The password field is always excluded. */
  fields: readonly string[];
  /** Name of the Cloudflare secret containing a PKCS#8 ES256 private key. */
  privateKeyEnvVarName: string;
  /** Defaults to `__Host-cloudflare-user-data`. */
  cookieName?: string;
  /** Optional JWS key identifier used for key rotation. */
  keyId?: string;
  /** Lifetime in seconds. Defaults to 3600 and cannot exceed 86400. */
  maxAge?: number;
}

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
  /**
   * Opt-in, browser-readable identification data. This data must never be
   * used for authorization and must be safely rendered by browser code.
   */
  userDataCookie?: UserDataCookieArgs;
}
