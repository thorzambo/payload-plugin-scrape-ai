import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import type { ResolvedPluginConfig } from '../types'
import { transformDocument } from '../pipeline/transform'

/**
 * Creates an afterChange hook that runs Stage 1+2 synchronously,
 * then queues AI enrichment and aggregate rebuild asynchronously.
 */
export function createAfterChangeHook(
  pluginOptions: ResolvedPluginConfig,
  collectionConfig: CollectionConfig,
): CollectionAfterChangeHook {
  return async ({ doc, req, operation, collection }) => {
    const { payload } = req

    try {
      // Check draft status
      if (pluginOptions.drafts === 'published-only' && doc._status === 'draft') {
        return doc
      }

      const collectionSlug = collection.slug

      // Determine locale
      const locale = req.locale || undefined

      // Run Stage 1+2 (fast, synchronous)
      const result = transformDocument({
        doc: doc as Record<string, unknown>,
        collectionSlug,
        collectionConfig,
        payload,
        pluginOptions,
        locale,
      })

      // Upsert into ai-content
      const existing = await payload.find({
        collection: 'ai-content',
        where: {
          sourceCollection: { equals: collectionSlug },
          sourceDocId: { equals: String(doc.id) },
          ...(locale ? { locale: { equals: locale } } : {}),
        },
        limit: 1,
      })

      const aiContentData = {
        sourceCollection: collectionSlug,
        sourceDocId: String(doc.id),
        slug: result.urlSlug,
        title: result.title,
        canonicalUrl: result.canonicalUrl,
        markdown: result.markdown,
        jsonLd: result.jsonLd,
        status: 'synced' as const,
        parentSlug: result.parentSlug || null,
        relatedSlugs: result.relatedSlugs,
        locale: locale || null,
        isDraft: result.isDraft,
        lastSynced: new Date().toISOString(),
        errorMessage: null,
        retryCount: 0,
      }

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'ai-content',
          id: existing.docs[0].id,
          data: aiContentData,
        })
      } else {
        await payload.create({
          collection: 'ai-content',
          data: aiContentData,
        })
      }

      // Queue AI enrichment if enabled (async, never blocks)
      // Check ai-config global for runtime toggle
      try {
        const aiConfig = await payload.findGlobal({ slug: 'ai-config' })
        if ((aiConfig as any)?.aiEnabled || pluginOptions.ai) {
          await payload.create({
            collection: 'ai-sync-queue',
            data: {
              jobType: 'enrich-document',
              sourceCollection: collectionSlug,
              sourceDocId: String(doc.id),
              status: 'pending',
            },
          })
        }
      } catch {
        // ai-config might not exist yet on first run — that's fine
      }

      // Queue aggregate rebuild
      await payload.create({
        collection: 'ai-sync-queue',
        data: {
          jobType: 'rebuild-aggregates',
          status: 'pending',
        },
      })
    } catch (error: any) {
      // Never break the user's save operation
      payload.logger.error(`[scrape-ai] afterChange error: ${error.message}`)
    }

    return doc
  }
}
