import middleware from '@natbienetre/cloudflare-env-var-password'

export const onRequest = middleware({
  getEnvVarName: (context: EventContext<any, any, any>): string => {
    const url = new URL(context.request.url)
    return 'PASS_' + url.pathname
  }
})
