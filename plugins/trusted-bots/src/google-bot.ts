import { GoogleBot } from './types';
import type { IPVerifier } from './types';
import { UserAgentVerifier } from './verifiers';

const sourceURL =
  'https://developers.google.com/search/apis/ipranges/googlebot.json';

export const bots = new Map<GoogleBot, IPVerifier>();

// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googlebot
bots.set(GoogleBot.Googlebot, {
  sourceURL,
  check: UserAgentVerifier('Googlebot'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googlebot-image
bots.set(GoogleBot.GooglebotImage, {
  sourceURL,
  check: UserAgentVerifier('Googlebot-Image'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googlebot-video
bots.set(GoogleBot.GooglebotVideo, {
  sourceURL,
  check: UserAgentVerifier('Googlebot-Video'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googlebot-news
// No dedicated user agent
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-storebot
bots.set(GoogleBot.StoreBot, {
  sourceURL,
  check: UserAgentVerifier('Storebot-Google'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-inspectiontool
bots.set(GoogleBot.InspectionTool, {
  sourceURL,
  check: UserAgentVerifier('Google-InspectionTool'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googleother
bots.set(GoogleBot.Other, {
  sourceURL,
  check: UserAgentVerifier('GoogleOther'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googleother-image
bots.set(GoogleBot.OtherImage, {
  sourceURL,
  check: UserAgentVerifier('GoogleOther-Image'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googleother-video
bots.set(GoogleBot.OtherVideo, {
  sourceURL,
  check: UserAgentVerifier('GoogleOther-Video'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-cloudvertexbot
bots.set(GoogleBot.CloudVertexBot, {
  sourceURL,
  check: UserAgentVerifier('Google-CloudVertexBot'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-extended
bots.set(GoogleBot.Extended, {
  sourceURL,
  check: UserAgentVerifier('Google-Extended'),
});
