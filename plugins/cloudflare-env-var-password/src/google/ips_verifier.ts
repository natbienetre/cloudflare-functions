import { containsCidr } from 'cidr-tools'
import pThrottle from 'p-throttle'

interface IPsData {
  creationTime: Date
  cidrs: string[]
}

export default class IPsVerifier {
  readonly url: string

  private ipsData: IPsData
  private readonly throttler = pThrottle({
    limit: 1,
    interval: 1000 * 60 * 60 // 1 hour
  })

  constructor (url: string) {
    this.url = url

    this.getData = this.getData.bind(this)
    this.update = this.update.bind(this)
    this.check = this.check.bind(this)

    // Initialize data
    this.update().catch(error => {
      throw error
    })
  }

  async update (): Promise<void> {
    const getData = this.throttler(this.getData)
    await getData().then(data => {
      console.info(`Refreshed trusted IPs with ${data.cidrs.length} cidrs, released at ${data.creationTime.toISOString()}...`)
      this.ipsData = data
    })
  }

  async getData (): Promise<IPsData> {
    const getDataFunc = this.getData

    try {
      this.getData = async () => this.ipsData

      console.debug(`Fetching trusted IPs from ${this.url}...`)

      return await fetch(this.url, {
        method: 'GET',
        headers: new Headers({
          'If-Modified-Since': this.ipsData.creationTime.toString()
        })
      }).then(async (res: Response): Promise<IPsData> => {
        const { headers } = res
        const contentType = headers.get('content-type') ?? ''

        if (contentType.includes('application/json')) {
          throw new Error(`Unexpected content-type: ${contentType}`)
        }

        return await res.json().then((data: {
          creationTime: string
          prefixes: Array<{
            ipv6Prefix?: string
            ipv4Prefix?: string
          }>
        }): IPsData => {
          return {
            creationTime: new Date(data.creationTime),
            cidrs: data.prefixes
              .map((prefix) => prefix.ipv4Prefix ?? prefix.ipv6Prefix ?? '')
              .filter(cidr => cidr !== '')
          }
        })
      })
    } finally {
      this.getData = getDataFunc
    }
  }

  check (ip: string): boolean {
    if (containsCidr(this.ipsData.cidrs, ip) as boolean) {
      this.update().catch(console.log)
      return true
    }

    return false
  }
}
