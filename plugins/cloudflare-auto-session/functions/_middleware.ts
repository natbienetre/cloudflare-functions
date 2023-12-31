import { Session } from '../src/session'
import type { PluginArgs, SessionSpec } from '../src/types'
import { withDefaults } from '../src/args'

const authenticatedQuery = 'authenticated'
const allowedQuery = 'allowed'

export const onRequestGet = (context: EventPluginContext<Record<string, string | undefined>, any, any, PluginArgs>): Response | Promise<Response> => {
  const { request, env, pluginArgs, next } = context

  // Get the arguments given to the Plugin by the developer
  const { cookieName, cookieSecret, formAsset, isValid } = withDefaults(pluginArgs)

  const session = new Session(cookieName, cookieSecret, isValid)

  if (!session.valid(request)) {
    const url = new URL(request.url)

    url.pathname = formAsset

    console.debug('Proxy to login form', url.toString())

    return env.ASSETS.fetch(new Request(url, request))
  }

  return next()
}

export const onRequestPost = ({ request, pluginArgs }: EventPluginContext<Record<string, string | undefined>, any, any, PluginArgs>): Response | Promise<Response> => {
  // Get the arguments given to the Plugin by the developer
  const { cookieName, cookieSecret, login, isValid } = withDefaults(pluginArgs)

  const session = new Session(cookieName, cookieSecret, isValid)

  if (session.valid(request)) {
    return new Response('Already logged in', {
      status: 302,
      headers: {
        Location: request.url
      }
    })
  }

  const url = new URL(request.url)

  return request.formData()
    .then(login)
    .then(({ authenticated, allowed, cookie }: SessionSpec): Response => {
      url.searchParams.set(authenticatedQuery, authenticated.toString())
      url.searchParams.set(allowedQuery, allowed.toString())

      const destinationURL = url.toString()

      if (!authenticated) {
        console.debug('Authentication failure', url.toString())

        return Response.redirect(destinationURL, 302)
      }

      if (!allowed) {
        console.debug('Permission error', url.toString())

        return Response.redirect(destinationURL, 302)
      }

      return session.start(request, cookie)
    })
}
