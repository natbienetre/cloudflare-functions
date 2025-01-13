import { ipGetter } from './cloudflare';
import { GoogleBot } from './types';
import type { PluginArgs } from './types';

export interface PluginArgsWithDefaults {
  allowedBots: Map<GoogleBot, boolean>;
  ipGetter: (req: Request) => Promise<string | false>;
  cache: Cache;
}

const Defaults = {
  allowedBots: new Map<GoogleBot, boolean>([
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
  ipGetter,
  cache: caches?.default,
};

export function withDefaults(args: PluginArgs): PluginArgsWithDefaults {
  return {
    ...Defaults,
    ...args,
  };
}
