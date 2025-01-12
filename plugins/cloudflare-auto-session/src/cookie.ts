export class Cookie {
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  setCookieHeader(
    value?: string,
    domain?: string,
    path?: string,
    expires?: Date,
    maxAge?: number,
    secure?: boolean,
    httpOnly?: boolean,
    sameSite?: string
  ): string {
    if (value === undefined) return `${this.name}=; Max-Age=0`;

    const cookieParts = [
      this.name + '=' + value,
      domain !== undefined ? 'Domain=' + domain : undefined,
      path !== undefined ? 'Path=' + path : undefined,
      expires !== undefined ? 'Expires=' + expires.toUTCString() : undefined,
      maxAge !== undefined ? 'Max-Age=' + maxAge.toString() : undefined,
      (secure ?? false) ? 'Secure' : undefined,
      (httpOnly ?? false) ? 'HttpOnly' : undefined,
      sameSite !== undefined ? 'SameSite=' + sameSite : undefined,
    ];

    return cookieParts.filter(part => part !== undefined).join('; ');
  }
}
