import type { PayloadRequest } from 'payload'
import type { ResolvedPluginConfig } from '../types'
import { detectContentCollections } from '../detection/smart-detect'
import { createAiProvider } from '../ai/provider'

/**
 * Create all authenticated admin API endpoints for the dashboard.
 */
export function createAdminEndpoints(pluginOptions: ResolvedPluginConfig, pluginRawOptions: any) {
  return [
    // GET /api/scrape-ai/status
    {
      path: '/scrape-ai/status',
      method: 'get' as const,
      handler: async (req: PayloadRequest) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const { payload } = req

        try {
          const [allEntries, pendingEntries, errorEntries, aiConfig] = await Promise.all([
            payload.find({
              collection: 'ai-content',
              where: { sourceCollection: { not_equals: '__aggregate' } },
              limit: 0,
            }),
            payload.find({
              collection: 'ai-content',
              where: { sourceCollection: { not_equals: '__aggregate' }, status: { equals: 'pending' } },
              limit: 0,
            }),
            payload.find({
              collection: 'ai-content',
              where: {
                sourceCollection: { not_equals: '__aggregate' },
                status: { in: ['error', 'error-permanent'] },
              },
              limit: 0,
            }),
            payload.findGlobal({ slug: 'ai-config' }).catch(() => null),
          ])

          // Count per collection
          const collectionCounts: Record<string, number> = {}
          // We can't group-by with Payload local API, so we query per collection
          const enabledCollections = (aiConfig as any)?.enabledCollections || {}
          for (const slug of Object.keys(enabledCollections)) {
            if (!enabledCollections[slug]) continue
            const count = await payload.find({
              collection: 'ai-content',
              where: { sourceCollection: { equals: slug } },
              limit: 0,
            })
            collectionCounts[slug] = count.totalDocs
          }

          return Response.json({
            totalEntries: allEntries.totalDocs,
            pendingCount: pendingEntries.totalDocs,
            errorCount: errorEntries.totalDocs,
            collections: collectionCounts,
            lastRebuild: (aiConfig as any)?.lastAggregateRebuild || null,
            aiEnabled: (aiConfig as any)?.aiEnabled || false,
            aiProvider: (aiConfig as any)?.aiProvider || null,
            aiModel: (aiConfig as any)?.aiModel || null,
            aiApiCallCount: (aiConfig as any)?.aiApiCallCount || 0,
          })
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500 })
        }
      },
    },

    // GET /api/scrape-ai/entries
    {
      path: '/scrape-ai/entries',
      method: 'get' as const,
      handler: async (req: PayloadRequest) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const { payload } = req

        const url = new URL(req.url || '', 'http://localhost')
        const page = parseInt(url.searchParams.get('page') || '1', 10)
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)
        const collection = url.searchParams.get('collection')
        const status = url.searchParams.get('status')

        const where: Record<string, any> = {
          sourceCollection: { not_equals: '__aggregate' },
        }
        if (collection) where.sourceCollection = { equals: collection }
        if (status) where.status = { equals: status }

        try {
          const result = await payload.find({
            collection: 'ai-content',
            where,
            page,
            limit,
            sort: '-lastSynced',
          })

          return Response.json({
            docs: result.docs.map((doc: any) => ({
              id: doc.id,
              title: doc.title,
              slug: doc.slug,
              sourceCollection: doc.sourceCollection,
              status: doc.status,
              lastSynced: doc.lastSynced,
              hasAiMeta: Boolean(doc.aiMeta),
              isDraft: doc.isDraft,
              errorMessage: doc.errorMessage,
            })),
            totalDocs: result.totalDocs,
            page: result.page,
            totalPages: result.totalPages,
            hasNextPage: result.hasNextPage,
          })
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500 })
        }
      },
    },

    // GET /api/scrape-ai/entry/:id
    {
      path: '/scrape-ai/entry/:id',
      method: 'get' as const,
      handler: async (req: PayloadRequest) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const { payload } = req
        const id = (req.routeParams as any)?.id

        try {
          const doc = await payload.findByID({ collection: 'ai-content', id })
          return Response.json(doc)
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 404 })
        }
      },
    },

    // POST /api/scrape-ai/regenerate
    {
      path: '/scrape-ai/regenerate',
      method: 'post' as const,
      handler: async (req: PayloadRequest) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const { payload } = req

        try {
          const body: any = await req.json?.() || {}

          if (body.all) {
            // Delete all non-aggregate entries to trigger full re-sync
            const all = await payload.find({
              collection: 'ai-content',
              where: { sourceCollection: { not_equals: '__aggregate' } },
              limit: 10000,
            })
            for (const doc of all.docs) {
              await payload.delete({ collection: 'ai-content', id: doc.id })
            }
            // Initial sync will re-run on next scheduler tick
            return Response.json({ message: 'Full regeneration queued', count: all.totalDocs })
          }

          if (body.ids && Array.isArray(body.ids)) {
            for (const id of body.ids) {
              await payload.update({
                collection: 'ai-content',
                id,
                data: { status: 'pending', retryCount: 0, errorMessage: null },
              })
            }
            return Response.json({ message: 'Regeneration queued', count: body.ids.length })
          }

          return Response.json({ error: 'Provide { all: true } or { ids: [...] }' }, { status: 400 })
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500 })
        }
      },
    },

    // POST /api/scrape-ai/toggle-collection
    {
      path: '/scrape-ai/toggle-collection',
      method: 'post' as const,
      handler: async (req: PayloadRequest) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const { payload } = req

        try {
          const body: any = await req.json?.() || {}
          const { collection: slug, enabled } = body

          if (!slug || typeof enabled !== 'boolean') {
            return Response.json({ error: 'Provide { collection, enabled }' }, { status: 400 })
          }

          const aiConfig = await payload.findGlobal({ slug: 'ai-config' })
          const currentEnabled = (aiConfig as any)?.enabledCollections || {}

          await payload.updateGlobal({
            slug: 'ai-config',
            data: {
              enabledCollections: { ...currentEnabled, [slug]: enabled },
            },
          })

          return Response.json({ message: `Collection '${slug}' ${enabled ? 'enabled' : 'disabled'}` })
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500 })
        }
      },
    },

    // POST /api/scrape-ai/ai-settings
    {
      path: '/scrape-ai/ai-settings',
      method: 'post' as const,
      handler: async (req: PayloadRequest) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const { payload } = req

        try {
          const body: any = await req.json?.() || {}
          const data: Record<string, any> = {}

          if (typeof body.aiEnabled === 'boolean') data.aiEnabled = body.aiEnabled
          if (body.aiProvider) data.aiProvider = body.aiProvider
          if (body.aiApiKey) data.aiApiKey = body.aiApiKey
          if (body.aiModel) data.aiModel = body.aiModel

          await payload.updateGlobal({ slug: 'ai-config', data })

          return Response.json({ message: 'AI settings updated' })
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500 })
        }
      },
    },

    // POST /api/scrape-ai/test-ai
    {
      path: '/scrape-ai/test-ai',
      method: 'post' as const,
      handler: async (req: PayloadRequest) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const { payload } = req

        try {
          const aiConfig = await payload.findGlobal({ slug: 'ai-config' })
          const provider = (aiConfig as any)?.aiProvider
          const apiKey = (aiConfig as any)?.aiApiKey || pluginOptions.ai?.apiKey
          const model = (aiConfig as any)?.aiModel

          if (!provider || !apiKey) {
            return Response.json({ success: false, error: 'No AI provider configured' })
          }

          const ai = createAiProvider({ provider, apiKey, model })

          if (!ai) {
            return Response.json({ success: false, error: 'Failed to create AI provider' })
          }

          const result = await ai.complete('Say "hello" in one word.', 'You are a test assistant.')
          return Response.json({ success: true, response: result })
        } catch (error: any) {
          return Response.json({ success: false, error: error.message })
        }
      },
    },

    // GET /api/scrape-ai/llms-txt-config
    {
      path: '/scrape-ai/llms-txt-config',
      method: 'get' as const,
      handler: async (req: PayloadRequest) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const { payload } = req

        try {
          const aiConfig = await payload.findGlobal({ slug: 'ai-config' })
          return Response.json({
            priority: (aiConfig as any)?.llmsTxtPriority || [],
            sections: (aiConfig as any)?.llmsTxtSections || [],
          })
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500 })
        }
      },
    },

    // POST /api/scrape-ai/llms-txt-config
    {
      path: '/scrape-ai/llms-txt-config',
      method: 'post' as const,
      handler: async (req: PayloadRequest) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const { payload } = req

        try {
          const body: any = await req.json?.() || {}
          const data: Record<string, any> = {}

          if (body.priority) data.llmsTxtPriority = body.priority
          if (body.sections) data.llmsTxtSections = body.sections

          await payload.updateGlobal({ slug: 'ai-config', data })

          // Queue aggregate rebuild
          await payload.create({
            collection: 'ai-sync-queue',
            data: { jobType: 'rebuild-aggregates', status: 'pending' },
          })

          return Response.json({ message: 'llms.txt config updated, rebuild queued' })
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500 })
        }
      },
    },

    // GET /api/scrape-ai/detected-collections
    {
      path: '/scrape-ai/detected-collections',
      method: 'get' as const,
      handler: async (req: PayloadRequest) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const { payload } = req

        try {
          const aiConfig = await payload.findGlobal({ slug: 'ai-config' })
          const enabledCollections = (aiConfig as any)?.enabledCollections || {}

          // Get all non-plugin collections
          const allCollections = Object.keys(payload.collections).filter(
            (slug) => !['ai-content', 'ai-sync-queue'].includes(slug),
          )

          const result = await Promise.all(
            allCollections.map(async (slug) => {
              const count = await payload.find({
                collection: slug,
                limit: 0,
              })
              return {
                slug,
                label: payload.collections[slug]?.config?.labels?.plural || slug,
                docCount: count.totalDocs,
                enabled: enabledCollections[slug] === true,
              }
            }),
          )

          return Response.json({ collections: result })
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500 })
        }
      },
    },
  ]
}
