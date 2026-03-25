import type { PayloadRequest } from 'payload'
import { RateLimiter, getClientIp, rateLimitedResponse } from './rate-limiter'

export function createContentMarkdownEndpoint(rateLimiter: RateLimiter) {
  return {
    path: '/ai/:collection/:slug',
    method: 'get' as const,
    handler: async (req: PayloadRequest) => {
      if (!rateLimiter.check(getClientIp(req))) {
        return rateLimitedResponse()
      }

      const { payload } = req
      const params = req.routeParams || {}
      const collection = params.collection as string
      let slug = params.slug as string

      // Strip .md extension if present
      if (slug?.endsWith('.md')) {
        slug = slug.slice(0, -3)
      }

      if (!collection || !slug) {
        return new Response('Not Found', { status: 404 })
      }

      const url = new URL(req.url || '', 'http://localhost')
      const locale = url.searchParams.get('locale')

      try {
        const whereClause: Record<string, any> = {
          sourceCollection: { equals: collection },
          slug: { equals: slug },
        }
        if (locale) {
          whereClause.locale = { equals: locale }
        }

        const result = await payload.find({
          collection: 'ai-content',
          where: whereClause,
          limit: 1,
        })

        if (result.docs.length === 0) {
          return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
        }

        const content = (result.docs[0] as any).markdown || ''
        const lastSynced = (result.docs[0] as any).lastSynced || ''

        return new Response(content, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=300',
            ...(lastSynced ? { ETag: `"${new Date(lastSynced).getTime()}"` } : {}),
          },
        })
      } catch (error: any) {
        return new Response(`Error: ${error.message}`, { status: 500 })
      }
    },
  }
}
