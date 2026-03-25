import type { CollectionAfterDeleteHook } from 'payload'
import type { ResolvedPluginConfig } from '../types'

/**
 * Creates an afterDelete hook that removes the corresponding ai-content entry
 * and queues an aggregate rebuild.
 */
export function createAfterDeleteHook(
  pluginOptions: ResolvedPluginConfig,
): CollectionAfterDeleteHook {
  return async ({ doc, req, collection }) => {
    const { payload } = req

    try {
      const collectionSlug = collection.slug

      // Bulk delete matching ai-content entries (all locales)
      await payload.delete({
        collection: 'ai-content',
        where: {
          sourceCollection: { equals: collectionSlug },
          sourceDocId: { equals: String(doc.id) },
        },
      })

      // Queue aggregate rebuild (deduplicated — skip if one is already pending)
      const existingRebuild = await payload.find({
        collection: 'ai-sync-queue',
        where: {
          jobType: { equals: 'rebuild-aggregates' },
          status: { in: ['pending', 'processing'] },
        },
        limit: 1,
      })
      if (existingRebuild.docs.length === 0) {
        await payload.create({
          collection: 'ai-sync-queue',
          data: {
            jobType: 'rebuild-aggregates',
            status: 'pending',
          },
        })
      }
    } catch (error: any) {
      payload.logger.error(`[scrape-ai] afterDelete error: ${error.message}`)
    }

    return doc
  }
}
