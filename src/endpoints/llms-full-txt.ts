import type { PayloadRequest } from 'payload'
import { RateLimiter, getClientIp, rateLimitedResponse } from './rate-limiter'

export function createLlmsFullTxtEndpoint(rateLimiter: RateLimiter) {
  return {
    path: '/llms-full.txt',
    method: 'get' as const,
    handler: async (req: PayloadRequest) => {
      if (!rateLimiter.check(getClientIp(req))) {
        return rateLimitedResponse()
      }

      const { payload } = req

      try {
        const result = await payload.find({
          collection: 'ai-content',
          where: {
            sourceCollection: { equals: '__aggregate' },
            sourceDocId: { equals: '__llms-full-txt' },
          },
          limit: 1,
        })

        if (result.docs.length === 0) {
          return new Response('# No content generated yet', {
            status: 200,
            headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
          })
        }

        const content = (result.docs[0] as any).markdown || ''
        const lastSynced = (result.docs[0] as any).lastSynced || ''

        return new Response(content, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=600',
            ...(lastSynced ? { ETag: `"${new Date(lastSynced).getTime()}"` } : {}),
          },
        })
      } catch (error: any) {
        return new Response(`Error: ${error.message}`, { status: 500 })
      }
    },
  }
}
