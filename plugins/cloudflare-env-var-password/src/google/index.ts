import IPsVerifier from './ips_verifier';

const GoogleBotVerifiers = {
  GoogleBot: new IPsVerifier(
    'https://developers.google.com/search/apis/ipranges/googlebot.json'
  ),
  SpecialCrawlers: new IPsVerifier(
    'https://developers.google.com/search/apis/ipranges/special-crawlers.json'
  ),
  UserTriggeredFetchers: new IPsVerifier(
    'https://developers.google.com/static/search/apis/ipranges/user-triggered-fetchers.json'
  ),
  AutoTriggeredFetchers: new IPsVerifier(
    'https://developers.google.com/static/search/apis/ipranges/user-triggered-fetchers-google.json'
  ),
};

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

const verifier = (
  userAgentChecker: (_: string) => boolean,
  verifier: IPsVerifier
): ((req: Request) => Promise<boolean>) => {
  return async (req: Request): Promise<boolean> => {
    const userAgent = req.headers.get('User-Agent');

    if (userAgent === null) {
      return false;
    }

    if (!userAgentChecker(userAgent)) {
      return false;
    }

    // https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#cf-connecting-ip
    const ip = req.headers.get('CF-Connecting-IP');

    if (ip === null) {
      return false;
    }

    return verifier.check(ip);
  };
};

const userAgentChecker = (expected: string): ((_: string) => boolean) => {
  return (userAgent: string) => userAgent.includes(expected);
};

export const commonBots = new Map<
  GoogleBot,
  (req: Request) => Promise<boolean>
>();

// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googlebot
commonBots.set(
  GoogleBot.Googlebot,
  verifier(userAgentChecker('Googlebot'), GoogleBotVerifiers.GoogleBot)
);
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googlebot-image
commonBots.set(
  GoogleBot.GooglebotImage,
  verifier(userAgentChecker('Googlebot-Image'), GoogleBotVerifiers.GoogleBot)
);
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googlebot-video
commonBots.set(
  GoogleBot.GooglebotVideo,
  verifier(userAgentChecker('Googlebot-Video'), GoogleBotVerifiers.GoogleBot)
);
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googlebot-news
// No dedicated user agent
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-storebot
commonBots.set(
  GoogleBot.StoreBot,
  verifier(userAgentChecker('Storebot-Google'), GoogleBotVerifiers.GoogleBot)
);
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-inspectiontool
commonBots.set(
  GoogleBot.InspectionTool,
  verifier(
    userAgentChecker('Google-InspectionTool'),
    GoogleBotVerifiers.GoogleBot
  )
);
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googleother
commonBots.set(
  GoogleBot.Other,
  verifier(userAgentChecker('GoogleOther'), GoogleBotVerifiers.GoogleBot)
);
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googleother-image
commonBots.set(
  GoogleBot.OtherImage,
  verifier(userAgentChecker('GoogleOther-Image'), GoogleBotVerifiers.GoogleBot)
);
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googleother-video
commonBots.set(
  GoogleBot.OtherVideo,
  verifier(userAgentChecker('GoogleOther-Video'), GoogleBotVerifiers.GoogleBot)
);
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-cloudvertexbot
commonBots.set(
  GoogleBot.CloudVertexBot,
  verifier(
    userAgentChecker('Google-CloudVertexBot'),
    GoogleBotVerifiers.GoogleBot
  )
);
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-extended
commonBots.set(
  GoogleBot.Extended,
  verifier(userAgentChecker('Google-Extended'), GoogleBotVerifiers.GoogleBot)
);

export const specialBots = new Map<
  GoogleBot,
  (req: Request) => Promise<boolean>
>();

// https://developers.google.com/search/docs/crawling-indexing/google-special-case-crawlers#apis-google
specialBots.set(
  GoogleBot.APIsGoogle,
  verifier(userAgentChecker('APIs-Google'), GoogleBotVerifiers.SpecialCrawlers)
);
// https://developers.google.com/search/docs/crawling-indexing/google-special-case-crawlers#adsbot-mobile-web
specialBots.set(
  GoogleBot.AdsBotMobile,
  verifier(
    userAgentChecker('AdsBot-Google-Mobile'),
    GoogleBotVerifiers.SpecialCrawlers
  )
);
specialBots.set(
  GoogleBot.AdsBot,
  verifier(
    userAgentChecker('AdsBot-Google'),
    GoogleBotVerifiers.SpecialCrawlers
  )
);
// https://developers.google.com/search/docs/crawling-indexing/google-special-case-crawlers#adsense
specialBots.set(
  GoogleBot.AdSense,
  verifier(
    userAgentChecker('Mediapartners-Google'),
    GoogleBotVerifiers.SpecialCrawlers
  )
);
// https://developers.google.com/search/docs/crawling-indexing/google-special-case-crawlers#google-safety
specialBots.set(
  GoogleBot.Safety,
  verifier(
    userAgentChecker('Google-Safety'),
    GoogleBotVerifiers.SpecialCrawlers
  )
);

export const userTriggeredBots = new Map<
  GoogleBot,
  (req: Request) => Promise<boolean>
>();

// https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers#feedfetcher
userTriggeredBots.set(
  GoogleBot.UserTriggeredFeedFetcher,
  verifier(
    userAgentChecker('FeedFetcher-Google'),
    GoogleBotVerifiers.UserTriggeredFetchers
  )
);
// https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers#googleproducer
userTriggeredBots.set(
  GoogleBot.UserTriggeredPublisherCenter,
  verifier(
    userAgentChecker('GoogleProducer'),
    GoogleBotVerifiers.UserTriggeredFetchers
  )
);
// https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers#google-read-aloud
userTriggeredBots.set(
  GoogleBot.UserTriggeredReadAloud,
  verifier(
    userAgentChecker('Google-Read-Aloud'),
    GoogleBotVerifiers.UserTriggeredFetchers
  )
);
// https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers#google_site_verifier
userTriggeredBots.set(
  GoogleBot.UserTriggeredSiteVerifier,
  verifier(
    userAgentChecker('Google-Site-Verification'),
    GoogleBotVerifiers.UserTriggeredFetchers
  )
);

export const autoTriggeredBots = new Map<
  GoogleBot,
  (req: Request) => Promise<boolean>
>();

// https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers#feedfetcher
autoTriggeredBots.set(
  GoogleBot.AutoTriggeredFeedFetcher,
  verifier(
    userAgentChecker('FeedFetcher-Google'),
    GoogleBotVerifiers.AutoTriggeredFetchers
  )
);
// https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers#googleproducer
autoTriggeredBots.set(
  GoogleBot.AutoTriggeredPublisherCenter,
  verifier(
    userAgentChecker('GoogleProducer'),
    GoogleBotVerifiers.AutoTriggeredFetchers
  )
);
// https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers#google-read-aloud
autoTriggeredBots.set(
  GoogleBot.AutoTriggeredReadAloud,
  verifier(
    userAgentChecker('Google-Read-Aloud'),
    GoogleBotVerifiers.AutoTriggeredFetchers
  )
);
// https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers#google_site_verifier
autoTriggeredBots.set(
  GoogleBot.AutoTriggeredSiteVerifier,
  verifier(
    userAgentChecker('Google-Site-Verification'),
    GoogleBotVerifiers.AutoTriggeredFetchers
  )
);

export const allBots = new Map<GoogleBot, (req: Request) => Promise<boolean>>([
  ...commonBots,
  ...specialBots,
  ...userTriggeredBots,
  ...autoTriggeredBots,
]);
