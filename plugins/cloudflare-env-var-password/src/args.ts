import { GoogleBot } from './google';
import type {
  PluginArgs,
  AutoSessionArgs,
  AllowedBots,
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
  allowedBots: AllowedBots;
}

export const Defaults = {
  session: {
    cookieName: 'cloudflare-plugin',
  },
  getEnvVarName: (
    _: EventContext<
      Record<string, string | undefined>,
      string,
      Record<string, unknown>
    >
  ): string => 'CREDENTIALS',
  passwordEncodingMethod: '',
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
  allowedBots: {
    google: new Map<GoogleBot, boolean>([
      [GoogleBot.Googlebot, true],
      [GoogleBot.GooglebotImage, true],
      [GoogleBot.GooglebotVideo, true],
      [GoogleBot.StoreBot, true],
      [GoogleBot.InspectionTool, true],
      [GoogleBot.Other, false],
      [GoogleBot.OtherImage, false],
      [GoogleBot.OtherVideo, false],
      [GoogleBot.CloudVertexBot, false],
      [GoogleBot.Extended, false],
      [GoogleBot.APIsGoogle, false],
      [GoogleBot.AdsBot, false],
      [GoogleBot.AdsBotMobile, false],
      [GoogleBot.AdSense, false],
      [GoogleBot.Safety, true],
      [GoogleBot.AutoTriggeredFeedFetcher, false],
      [GoogleBot.AutoTriggeredPublisherCenter, false],
      [GoogleBot.AutoTriggeredReadAloud, false],
      [GoogleBot.AutoTriggeredSiteVerifier, false],
      [GoogleBot.UserTriggeredFeedFetcher, false],
      [GoogleBot.UserTriggeredPublisherCenter, false],
      [GoogleBot.UserTriggeredReadAloud, false],
      [GoogleBot.UserTriggeredSiteVerifier, false],
    ]),
  },
};

export function withDefaults(args: PluginArgs): PluginArgsWithDefaults {
  return {
    ...Defaults,
    ...args,
  };
}
