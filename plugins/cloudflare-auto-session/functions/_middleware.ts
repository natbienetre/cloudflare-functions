import { serveForm, Session } from '../src/session';
import type { CookieData, PluginArgs, SessionSpec } from '../src/types';
import { withDefaults } from '../src/args';

const authenticatedQuery = 'authenticated';
const allowedQuery = 'allowed';

export const onRequestGet: PagesPluginFunction<
  unknown,
  string,
  Record<string, unknown>,
  PluginArgs<CookieData>
> = async context => {
  const { request, pluginArgs, next } = context;

  // Get the arguments given to the Plugin by the developer
  const { cookieName, cookieSecret, formAsset, isValid, byPass } =
    withDefaults(pluginArgs);

  const session = new Session(cookieName, cookieSecret, isValid);

  return [
    byPass,
    async (request: Request): Promise<boolean> => {
      const cookie = session.getCookie(request);
      if (cookie === undefined) {
        return false;
      }

      if (!session.valid(cookie)) {
        console.info('Invalid cookie');
        return false;
      }

      return true;
    },
  ]
    .map(fn => fn(request))
    .reduce((acc, curr) => acc.then(acc => acc || curr), Promise.resolve(false))
    .then(trusted => {
      if (!trusted) {
        return serveForm(formAsset)(context);
      }

      // Continue to the next middleware
      return next();
    });
};

export const onRequestPost: PagesPluginFunction<
  unknown,
  string,
  Record<string, unknown>,
  PluginArgs<CookieData>
> = async ({ request, pluginArgs }) => {
  // Get the arguments given to the Plugin by the developer
  // AllowedBot is not used for POST requests
  const { cookieName, cookieSecret, login, isValid } = withDefaults(pluginArgs);

  const session = new Session(cookieName, cookieSecret, isValid);

  return login(request).then(
    ({ authenticated, allowed, cookie }: SessionSpec<CookieData>): Response => {
      const url = new URL(request.url);

      url.searchParams.set(authenticatedQuery, authenticated.toString());
      url.searchParams.set(allowedQuery, allowed.toString());

      const destinationURL = url.toString();

      if (!authenticated) {
        console.info('Authentication failure');

        return Response.redirect(destinationURL, 302);
      }

      if (!allowed) {
        console.warn('Permission error');

        return Response.redirect(destinationURL, 302);
      }

      console.info('Starting session');

      // Start a session with the cookie
      // Redirect to the original URL
      // Only when the user is authenticated and allowed
      return session.start(request, cookie);
    }
  );
};
