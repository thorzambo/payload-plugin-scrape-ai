import type { PayloadRequest } from 'payload'
import { RateLimiter, getClientIp, rateLimitedResponse } from './rate-limiter'
import { getCached, setCache } from '../cache/aggregate-cache'

export function createSitemapJsonEndpoint(rateLimiter: RateLimiter) {
  return {
    path: '/ai/sitemap.json',
    method: 'get' as const,
    handler: async (req: PayloadRequest) => {
      if (!rateLimiter.check(getClientIp(req))) {
        return rateLimitedResponse()
      }

      const cached = getCached('sitemap-json')
      if (cached) {
        let parsed: any
        try {
          parsed = JSON.parse(cached)
        } catch {
          parsed = { error: 'Invalid sitemap data' }
        }
        return Response.json(parsed, {
          status: 200,
          headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600' },
        })
      }

      const { payload } = req

      try {
        const result = await payload.find({
          collection: 'ai-aggregates',
          where: { key: { equals: '__sitemap-json' } },
          limit: 1,
        })

        if (result.docs.length === 0) {
          return Response.json({ error: 'No sitemap generated yet' }, { status: 200 })
        }

        const content = (result.docs[0] as any).content || '{}'
        const lastGenerated = (result.docs[0] as any).lastGenerated || ''

        setCache('sitemap-json', content)

        // The sitemap is stored as JSON string in the content field
        let parsed: any
        try {
          parsed = JSON.parse(content)
        } catch {
          parsed = { error: 'Invalid sitemap data' }
        }

        return Response.json(parsed, {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=600',
            ...(lastGenerated ? { ETag: `"${new Date(lastGenerated).getTime()}"` } : {}),
          },
        })
      } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 })
      }
    },
  }
}
