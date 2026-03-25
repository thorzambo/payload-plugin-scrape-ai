import type { PayloadRequest } from 'payload'
import { RateLimiter, getClientIp, rateLimitedResponse } from './rate-limiter'
import { getCached, setCache } from '../cache/aggregate-cache'

export function createLlmsTxtEndpoint(rateLimiter: RateLimiter) {
  return {
    path: '/llms.txt',
    method: 'get' as const,
    handler: async (req: PayloadRequest) => {
      if (!rateLimiter.check(getClientIp(req))) {
        return rateLimitedResponse()
      }

      const cached = getCached('llms-txt')
      if (cached) {
        return new Response(cached, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=600',
          },
        })
      }

      const { payload } = req
      const locale = new URL(req.url || '', 'http://localhost').searchParams.get('locale')

      try {
        const result = await payload.find({
          collection: 'ai-aggregates',
          where: { key: { equals: '__llms-txt' } },
          limit: 1,
        })

        if (result.docs.length === 0) {
          return new Response('# No content generated yet\n\n> Run initial sync to generate content.', {
            status: 200,
            headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
          })
        }

        const content = (result.docs[0] as any).content || ''
        const lastGenerated = (result.docs[0] as any).lastGenerated || ''

        setCache('llms-txt', content)

        return new Response(content, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=600',
            ...(lastGenerated ? { ETag: `"${new Date(lastGenerated).getTime()}"` } : {}),
          },
        })
      } catch (error: any) {
        return new Response(`Error: ${error.message}`, { status: 500 })
      }
    },
  }
}
