import { GoogleBot } from './types';
import type { IPVerifier } from './types';
import { UserAgentVerifier } from './verifiers';

const sourceURL =
  'https://developers.google.com/search/apis/ipranges/user-triggered-fetchers.json';

export const bots = new Map<GoogleBot, IPVerifier>();

// https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers#feedfetcher
bots.set(GoogleBot.AutoTriggeredFeedFetcher, {
  sourceURL,
  check: UserAgentVerifier('FeedFetcher-Google'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers#googleproducer
bots.set(GoogleBot.AutoTriggeredPublisherCenter, {
  sourceURL,
  check: UserAgentVerifier('GoogleProducer'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers#google-read-aloud
bots.set(GoogleBot.AutoTriggeredReadAloud, {
  sourceURL,
  check: UserAgentVerifier('Google-Read-Aloud'),
});
// https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers#google_site_verifier
bots.set(GoogleBot.AutoTriggeredSiteVerifier, {
  sourceURL,
  check: UserAgentVerifier('Google-Site-Verification'),
});
