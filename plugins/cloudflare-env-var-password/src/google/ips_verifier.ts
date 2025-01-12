import { containsCidr } from 'cidr-tools';

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

export default class IPsVerifier {
  readonly url: string;
  readonly cache: Cache;

  constructor(url: string) {
    this.url = url;
    this.cache = caches.default;
  }

  async parseResponse(response: Response): Promise<IPsData> {
    const { headers } = response;
    const contentType = headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      throw new Error(`Unexpected content-type: ${contentType}`);
    }

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
    return this.cache
      .match(this.url)
      .then(this.parseResponse)
      .then((ipsData: IPsData): boolean => containsCidr(ipsData.cidrs, ip));
  }
}
