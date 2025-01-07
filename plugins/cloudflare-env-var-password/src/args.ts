import { GoogleBot } from './google';
import type {
  PluginArgs,
  AllowedBots,
  PasswordEncodingMethod,
  Env,
} from './types';

export interface PluginArgsWithDefaults {
  cookieName: string;
  getEnvVarName: (context: EventContext<Env, string, unknown>) => string;
  passwordEncodingMethod: PasswordEncodingMethod;
  passwordFieldName: string;
  allowedBots: AllowedBots;
}

export const Defaults = {
  cookieName: 'cloudflare-plugin',
  getEnvVarName: (_: EventContext<Env, string, unknown>): string =>
    'CREDENTIALS',
  passwordEncodingMethod: '',
  passwordFieldName: 'password',
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
