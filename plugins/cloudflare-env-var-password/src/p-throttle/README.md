# P-Throttle

This local fork of [p-throttle](https://www.npmjs.com/package/p-throttle) is to avoid depending on `FinalizationRegistry` which does not exist in Cloudflare worked environment (See [cloudflare/workers-sdk#2258](https://github.com/cloudflare/workers-sdk/issues/2258)).
