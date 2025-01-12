import type { CookieSpec, CookieData } from './types';

export class Cookie<Data extends CookieData = CookieData> {
  readonly spec?: CookieSpec<Data>;

  constructor(spec?: CookieSpec<Data>) {
    this.spec = spec;
  }

  setCookieHeader(name: string, encode: (data: Data) => string): string {
    if (this.spec === undefined) return '';

    const value = encode(this.spec.data);

    const cookieParts = [
      name + '=' + value,
      this.spec.domain !== undefined ? 'Domain=' + this.spec.domain : '',
      this.spec.path !== undefined ? 'Path=' + this.spec.path : '',
      this.spec.expires !== undefined
        ? 'Expires=' + this.spec.expires.toUTCString()
        : '',
      this.spec.maxAge !== undefined
        ? 'Max-Age=' + this.spec.maxAge.toString()
        : '',
      (this.spec.secure ?? false) ? 'Secure' : '',
      (this.spec.httpOnly ?? false) ? 'HttpOnly' : '',
      this.spec.sameSite !== undefined ? 'SameSite=' + this.spec.sameSite : '',
    ];

    return cookieParts.filter(part => part !== '').join('; ');
  }
}
