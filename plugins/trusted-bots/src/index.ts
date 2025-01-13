import { bots as commonBots } from './google-bot';
import { bots as specialBots } from './google-special-bot';
import { bots as userTriggeredBots } from './google-user-triggered-fetchers';
import { bots as autoTriggeredBots } from './google-auto-triggered-fetchers';
import type { GoogleBot, IPVerifier } from './types';
import { IPsVerifier, verifier } from './verifiers';
import { withDefaults } from './args';

export const allBots = new Map([
  ...commonBots,
  ...specialBots,
  ...userTriggeredBots,
  ...autoTriggeredBots,
]);

export class Plugin {
  readonly verifiers: Array<(req: Request) => Promise<boolean>>;

  constructor(
    ipGetter: (_: Request) => Promise<string | false>,
    cache: Cache,
    allowedBots: Map<GoogleBot, boolean>
  ) {
    const verifiers = [...allowedBots]
      .filter(([_, enabled]) => enabled)
      .map(([bot, _]) => allBots.get(bot))
      .filter(v => v !== undefined);

    const ipsVerifiers = new Map(
      [...new Set(verifiers.map((verif: IPVerifier) => verif.sourceURL))].map(
        sourceURL => [sourceURL, new IPsVerifier(sourceURL, cache)]
      )
    );
    this.verifiers = verifiers.map((verif: IPVerifier) =>
      verifier(verif.check, ipsVerifiers.get(verif.sourceURL)!)(ipGetter)
    );
  }

  async verify(req: Request): Promise<boolean> {
    return this.verifiers
      .map(verifier => verifier(req))
      .reduce(
        async (acc, cur) => (await acc) || (await cur),
        Promise.resolve(false)
      );
  }
}

export { withDefaults, GoogleBot };
