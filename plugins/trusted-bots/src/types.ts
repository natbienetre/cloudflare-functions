export enum GoogleBot {
  Googlebot,
  GooglebotImage,
  GooglebotVideo,
  StoreBot,
  InspectionTool,
  Other,
  OtherImage,
  OtherVideo,
  CloudVertexBot,
  Extended,

  APIsGoogle,
  AdsBot,
  AdsBotMobile,
  AdSense,
  Safety,

  UserTriggeredFeedFetcher,
  UserTriggeredPublisherCenter,
  UserTriggeredReadAloud,
  UserTriggeredSiteVerifier,

  AutoTriggeredFeedFetcher,
  AutoTriggeredPublisherCenter,
  AutoTriggeredReadAloud,
  AutoTriggeredSiteVerifier,
}

export type IPVerifier = {
  check: (userAgent: string) => Promise<boolean>;
  sourceURL: string;
};

export type Verifier = (
  ipGetter: (_: Request) => Promise<string | false>
) => (_: Request) => Promise<boolean>;

export interface PluginArgs {
  ipGetter?: (_: Request) => Promise<string | false>;
  cache?: Cache;
  allowedBots?: Map<GoogleBot, boolean>;
}
