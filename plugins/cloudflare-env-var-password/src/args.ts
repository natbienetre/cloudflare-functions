import type {
  PluginArgs,
  AutoSessionArgs,
  PasswordEncodingMethod,
  UserDataCookieArgs,
} from './types';

export interface UserDataCookieArgsWithDefaults extends UserDataCookieArgs {
  cookieName: string;
  maxAge: number;
}

export interface PluginArgsWithDefaults {
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
  userDataCookie?: UserDataCookieArgsWithDefaults;
  missingPasswordCallback: (
    context: EventContext<
      Record<string, string | undefined>,
      string,
      Record<string, unknown>
    >
  ) => Promise<Response>;
}

export const Defaults = {
  getEnvVarName: (
    _: EventContext<
      Record<string, string | undefined>,
      string,
      Record<string, unknown>
    >
  ): string => 'CREDENTIALS',
  passwordFieldName: 'password',
  missingPasswordCallback: async (
    context: EventContext<
      Record<string, string | undefined>,
      string,
      Record<string, unknown>
    >
  ): Promise<Response> => {
    throw new Error(`Missing password for ${context.request.url}`);
  },
};

const userDataCookieDefaults = {
  cookieName: '__Host-cloudflare-user-data',
  maxAge: 3600,
};

const cookieNamePattern = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const fieldNamePattern = /^[A-Za-z0-9_.-]{1,64}$/;
const environmentVariableNamePattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
const keyIdPattern = /^[A-Za-z0-9_.-]{1,128}$/;

function withUserDataCookieDefaults(
  args: UserDataCookieArgs,
  passwordFieldName: string
): UserDataCookieArgsWithDefaults {
  const result = {
    ...userDataCookieDefaults,
    ...args,
  };

  if (!cookieNamePattern.test(result.cookieName)) {
    throw new Error('Invalid user data cookie name');
  }

  if (
    !Number.isInteger(result.maxAge) ||
    result.maxAge < 1 ||
    result.maxAge > 86400
  ) {
    throw new Error('User data cookie maxAge must be between 1 and 86400');
  }

  if (!environmentVariableNamePattern.test(result.privateKeyEnvVarName)) {
    throw new Error(
      'Invalid user data cookie private key environment variable name'
    );
  }

  if (result.keyId !== undefined && !keyIdPattern.test(result.keyId)) {
    throw new Error('Invalid user data cookie key identifier');
  }

  if (
    !Array.isArray(result.fields) ||
    result.fields.length === 0 ||
    result.fields.length > 16
  ) {
    throw new Error(
      'User data cookie fields must contain between 1 and 16 entries'
    );
  }

  const uniqueFields = new Set(result.fields);
  if (
    uniqueFields.size !== result.fields.length ||
    result.fields.some(
      field => !fieldNamePattern.test(field) || field === passwordFieldName
    )
  ) {
    throw new Error(
      'User data cookie fields must be unique, valid names and exclude the password field'
    );
  }

  return result;
}

export function withDefaults(args: PluginArgs): PluginArgsWithDefaults {
  const passwordFieldName =
    args.passwordFieldName ?? Defaults.passwordFieldName;

  return {
    ...Defaults,
    ...args,
    passwordFieldName,
    userDataCookie:
      args.userDataCookie === undefined
        ? undefined
        : withUserDataCookieDefaults(args.userDataCookie, passwordFieldName),
  };
}
