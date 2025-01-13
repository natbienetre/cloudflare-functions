import type {
  PluginArgs,
  AutoSessionArgs,
  PasswordEncodingMethod,
} from './types';

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

export function withDefaults(args: PluginArgs): PluginArgsWithDefaults {
  return {
    ...Defaults,
    ...args,
  };
}
