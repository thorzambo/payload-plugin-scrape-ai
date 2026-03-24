import type { Payload } from 'payload'
import type { ResolvedPluginConfig, IAiProvider } from '../types'
import { transformDocument } from '../pipeline/transform'

/**
 * Retry errored ai-content entries.
 * Called periodically (every 5 minutes) by the scheduler.
 */
export async function retryErrors(
  payload: Payload,
  pluginOptions: ResolvedPluginConfig,
): Promise<void> {
  // Find entries with error status and retryCount < 3
  const errored = await payload.find({
    collection: 'ai-content',
    where: {
      status: { equals: 'error' },
      retryCount: { less_than: 3 },
      sourceCollection: { not_equals: '__aggregate' },
    },
    limit: 10,
  })

  if (errored.docs.length === 0) return

  payload.logger.info(`[scrape-ai] Retrying ${errored.docs.length} errored entries`)

  for (const entry of errored.docs) {
    const collectionSlug = (entry as any).sourceCollection as string
    const sourceDocId = (entry as any).sourceDocId as string
    const currentRetryCount = ((entry as any).retryCount as number) || 0

    try {
      // Re-fetch the source document
      const doc = await payload.findByID({
        collection: collectionSlug,
        id: sourceDocId,
      })

      if (!doc) {
        // Source document was deleted — clean up
        await payload.delete({
          collection: 'ai-content',
          id: entry.id,
        })
        continue
      }

      const collectionConfig = payload.collections[collectionSlug]?.config
      if (!collectionConfig) continue

      // Re-run pipeline
      const result = transformDocument({
        doc: doc as Record<string, unknown>,
        collectionSlug,
        collectionConfig,
        payload,
        pluginOptions,
      })

      // Update entry
      await payload.update({
        collection: 'ai-content',
        id: entry.id,
        data: {
          slug: result.urlSlug,
          title: result.title,
          markdown: result.markdown,
          jsonLd: result.jsonLd,
          status: 'synced',
          errorMessage: null,
          retryCount: 0,
          parentSlug: result.parentSlug || null,
          relatedSlugs: result.relatedSlugs,
          isDraft: result.isDraft,
          lastSynced: new Date().toISOString(),
        },
      })
    } catch (error: any) {
      const newRetryCount = currentRetryCount + 1
      const newStatus = newRetryCount >= 3 ? 'error-permanent' : 'error'

      await payload.update({
        collection: 'ai-content',
        id: entry.id,
        data: {
          status: newStatus,
          errorMessage: error.message,
          retryCount: newRetryCount,
        },
      })
    }
  }
}
