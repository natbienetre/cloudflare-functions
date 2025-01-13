export const ipGetter = async (request: Request): Promise<string | false> => {
  // https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#cf-connecting-ip
  return request.headers.get('CF-Connecting-IP') ?? false;
};
