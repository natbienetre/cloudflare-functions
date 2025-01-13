import { GoogleBot } from './types';
import type { IPVerifier } from './types';
import { UserAgentVerifier } from './verifiers';

const sourceURL =
  'https://developers.google.com/search/apis/ipranges/special-crawlers.json';

export const bots = new Map<GoogleBot, IPVerifier>();

// https://developers.google.com/search/docs/crawling-indexing/google-special-case-crawlers#apis-google
bots.set(GoogleBot.APIsGoogle, {
  sourceURL,
  check: UserAgentVerifier('APIs-Google'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-special-case-crawlers#adsbot-mobile-web
bots.set(GoogleBot.AdsBotMobile, {
  sourceURL,
  check: UserAgentVerifier('AdsBot-Google-Mobile'),
});
bots.set(GoogleBot.AdsBot, {
  sourceURL,
  check: UserAgentVerifier('AdsBot-Google'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-special-case-crawlers#adsense
bots.set(GoogleBot.AdSense, {
  sourceURL,
  check: UserAgentVerifier('Mediapartners-Google'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-special-case-crawlers#google-safety
bots.set(GoogleBot.Safety, {
  sourceURL,
  check: UserAgentVerifier('Google-Safety'),
});
