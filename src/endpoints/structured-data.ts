import type { PayloadRequest } from 'payload'
import { RateLimiter, getClientIp, rateLimitedResponse } from './rate-limiter'

export function createStructuredDataEndpoint(rateLimiter: RateLimiter) {
  return {
    path: '/ai/structured/:collection/:slug',
    method: 'get' as const,
    handler: async (req: PayloadRequest) => {
      if (!rateLimiter.check(getClientIp(req))) {
        return rateLimitedResponse()
      }

      const { payload } = req
      const params = req.routeParams || {}
      const collection = params.collection as string
      let slug = params.slug as string

      // Strip .json extension if present
      if (slug?.endsWith('.json')) {
        slug = slug.slice(0, -5)
      }

      if (!collection || !slug) {
        return Response.json({ error: 'Not Found' }, { status: 404 })
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
          return Response.json({ error: 'Not Found' }, { status: 404 })
        }

        const jsonLd = (result.docs[0] as any).jsonLd
        if (!jsonLd) {
          return Response.json({ error: 'No structured data available' }, { status: 404 })
        }

        const lastSynced = (result.docs[0] as any).lastSynced || ''

        return Response.json(jsonLd, {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=60',
            ...(lastSynced ? { ETag: `"${new Date(lastSynced).getTime()}"` } : {}),
          },
        })
      } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 })
      }
    },
  }
}
