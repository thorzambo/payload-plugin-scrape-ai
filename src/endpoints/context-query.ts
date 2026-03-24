import type { PayloadRequest } from 'payload'
import type { ContextQueryResponse, ContextQueryResult } from '../types'
import { RateLimiter, getClientIp, rateLimitedResponse } from './rate-limiter'

export function createContextQueryEndpoint(rateLimiter: RateLimiter, siteUrl: string) {
  return {
    path: '/ai/context',
    method: 'get' as const,
    handler: async (req: PayloadRequest) => {
      if (!rateLimiter.check(getClientIp(req))) {
        return rateLimitedResponse()
      }

      const { payload } = req
      const url = new URL(req.url || '', 'http://localhost')
      const query = url.searchParams.get('query')
      const limitParam = url.searchParams.get('limit')
      const collectionFilter = url.searchParams.get('collection')

      if (!query) {
        return Response.json({ error: 'query parameter is required' }, { status: 400 })
      }

      const limit = Math.min(Math.max(parseInt(limitParam || '5', 10) || 5, 1), 20)

      try {
        // Query all synced non-aggregate entries
        const whereClause: Record<string, any> = {
          sourceCollection: { not_equals: '__aggregate' },
          status: { equals: 'synced' },
        }
        if (collectionFilter) {
          whereClause.sourceCollection = { equals: collectionFilter }
        }

        const allContent = await payload.find({
          collection: 'ai-content',
          where: whereClause,
          limit: 1000,
          // Only fetch fields needed for scoring — avoid loading full markdown
        })

        // Score and rank entries
        const terms = tokenize(query)
        const scored: Array<ContextQueryResult & { score: number }> = []

        for (const entry of allContent.docs) {
          const title = ((entry as any).title as string) || ''
          const slug = ((entry as any).slug as string) || ''
          const markdown = ((entry as any).markdown as string) || ''
          const collection = ((entry as any).sourceCollection as string) || ''
          const aiMeta = (entry as any).aiMeta as any
          const topics: string[] = aiMeta?.topics || []
          const entities: string[] = aiMeta?.entities || []
          const summary: string = aiMeta?.summary || ''

          let score = 0

          for (const term of terms) {
            const termLower = term.toLowerCase()

            // Title matches (3x weight)
            if (title.toLowerCase().includes(termLower)) {
              score += 3
            }

            // Slug matches (2x weight)
            if (slug.toLowerCase().includes(termLower)) {
              score += 2
            }

            // Summary or title-based body matches (1x weight)
            // We avoid scoring against full markdown to reduce memory pressure
            if (summary.toLowerCase().includes(termLower)) {
              score += 1
            }

            // Topic matches (4x weight)
            for (const topic of topics) {
              if (topic.toLowerCase().includes(termLower)) {
                score += 4
              }
            }

            // Entity matches (3x weight)
            for (const entity of entities) {
              if (entity.toLowerCase().includes(termLower)) {
                score += 3
              }
            }

            // Summary matches (2x weight)
            if (summary.toLowerCase().includes(termLower)) {
              score += 2
            }
          }

          if (score > 0) {
            // Normalize score to 0-1 range (rough approximation)
            const maxPossibleScore = terms.length * (3 + 2 + 1 + 4 + 3 + 2) // 15 per term max
            const normalizedScore = Math.min(score / maxPossibleScore, 1)

            scored.push({
              title,
              slug,
              collection,
              url: `/ai/${collection}/${slug}.md`,
              canonicalUrl: ((entry as any).canonicalUrl as string) || `${siteUrl}/${slug}`,
              excerpt: (summary || title).slice(0, 200).trim(),
              summary: summary || undefined,
              topics: topics.length > 0 ? topics : undefined,
              relevanceScore: Math.round(normalizedScore * 100) / 100,
              score,
            })
          }
        }

        // Sort by score descending, take top N
        scored.sort((a, b) => b.score - a.score)
        const topResults = scored.slice(0, limit)

        // Remove internal score field
        const results: ContextQueryResult[] = topResults.map(({ score, ...rest }) => rest)

        const response: ContextQueryResponse = {
          query,
          results,
          totalResults: results.length,
        }

        return Response.json(response, {
          status: 200,
          headers: { 'Cache-Control': 'public, max-age=30' },
        })
      } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 })
      }
    },
  }
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1)
}
