import { containsCidr } from 'cidr-tools';
import type { Verifier } from './types';

interface IPsData {
  creationTime: Date;
  cidrs: string[];
}

type FileFormat = {
  creationTime: string;
  prefixes: Array<{
    ipv6Prefix?: string;
    ipv4Prefix?: string;
  }>;
};

const cacheDuration = 60 * 60 * 6; // 6 hours

export const UserAgentVerifier = (
  expectedUserAgent: string
): ((_: string) => Promise<boolean>) => {
  const expected = expectedUserAgent.toLowerCase();
  return async (userAgent: string) =>
    userAgent.toLowerCase().includes(expected);
};

export class IPsVerifier {
  readonly sourceURL: string;
  readonly cache: Cache;

  private fetch: Promise<Response> | undefined = undefined;

  constructor(url: string, cache: Cache) {
    this.sourceURL = url;
    this.cache = cache;
  }

  async parseResponse(response: Response): Promise<IPsData> {
    return response.json().then((data: FileFormat): IPsData => {
      return {
        creationTime: new Date(data.creationTime),
        cidrs: data.prefixes
          .map(prefix => prefix.ipv4Prefix ?? prefix.ipv6Prefix ?? '')
          .filter(cidr => cidr !== ''),
      };
    });
  }

  async check(ip: string): Promise<boolean> {
    const sourceURL = this.sourceURL;

    // Use cache API to store the response for 1 hour
    // See https://developers.cloudflare.com/workers/examples/cache-api/
    return this.cache
      .match(sourceURL)
      .then(async (response: Response | undefined): Promise<Response> => {
        if (response !== undefined) {
          console.debug(
            'Using cached response for',
            sourceURL,
            response.status
          );

          return response;
        }

        if (this.fetch !== undefined) {
          return this.fetch.then(async (response): Promise<Response> => {
            if (response === undefined) {
              throw new Error(
                `Failed to fetch and cache response for ${sourceURL}`
              );
            }

            console.debug('Waited response for', sourceURL, response.status);

            return response;
          });
        }

        const fetching = fetch(sourceURL)
          .then(async (response: Response): Promise<Response> => {
            if (!response.ok) {
              throw new Error(`Unexpected response status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type') ?? '';

            if (!contentType.includes('application/json')) {
              throw new Error(`Unexpected content-type: ${contentType}`);
            }

            return response;
          })
          .then(response => {
            // Must use Response constructor to inherit all of response's fields
            const responseWithCache = new Response(response.body, response);

            // Any changes made to the response here will be reflected in the cached value
            responseWithCache.headers.append(
              'cache-control',
              `max-age=${cacheDuration}`
            );

            return responseWithCache;
          })
          .then(async (response: Response): Promise<Response> => {
            console.debug('Caching response for', sourceURL, response.status);

            this.cache.put(sourceURL, response.clone());

            return response.clone();
          });

        this.fetch = fetching;

        return fetching!;
      })
      .then(response => response.clone())
      .then(this.parseResponse)
      .then((ipsData: IPsData): boolean => {
        console.debug(
          `Checking if IP ${ip} is in the list of CIDRs`,
          ipsData.cidrs
        );
        return containsCidr(ipsData.cidrs, ip);
      })
      .finally(() => {
        this.fetch = undefined;
      });
  }
}

export const verifier = (
  userAgentVerifier: (_: string) => Promise<boolean>,
  verifier: IPsVerifier
): Verifier => {
  return ipGetter =>
    async (req: Request): Promise<boolean> => {
      const userAgent = req.headers.get('User-Agent');

      if (userAgent === null) {
        return false;
      }

      return userAgentVerifier(userAgent).then(trustedUserAgent => {
        if (!trustedUserAgent) {
          return false;
        }

        return ipGetter(req).then(ip => {
          if (ip === false) {
            return false;
          }

          return verifier.check(ip);
        });
      });
    };
};
