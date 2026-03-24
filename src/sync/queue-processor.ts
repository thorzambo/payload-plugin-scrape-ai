import type { Payload } from 'payload'
import type { ResolvedPluginConfig, IAiProvider, AiConfigGlobal, AiSyncQueueDoc, AiContentDoc } from '../types'
import { enrichDocument } from '../pipeline/transform'
import { runInitialSync } from './initial-sync'
import { generateLlmsTxt } from '../generators/llms-txt'
import { generateLlmsFullTxt } from '../generators/llms-full-txt'
import { generateAiSitemap } from '../generators/sitemap'

/**
 * Process pending jobs from the ai-sync-queue.
 */
export async function processQueue(
  payload: Payload,
  pluginOptions: ResolvedPluginConfig,
  aiProvider: IAiProvider | null,
): Promise<void> {
  // Process initial-sync jobs first
  await processInitialSyncJobs(payload, pluginOptions)

  // Process enrich-document jobs
  if (aiProvider) {
    await processEnrichJobs(payload, aiProvider)
  }

  // Process rebuild-aggregates jobs
  await processRebuildJobs(payload, pluginOptions)

  // Cleanup completed/failed jobs older than 24 hours
  await cleanupOldJobs(payload)
}

async function processInitialSyncJobs(
  payload: Payload,
  pluginOptions: ResolvedPluginConfig,
): Promise<void> {
  const jobs = await payload.find({
    collection: 'ai-sync-queue',
    where: {
      jobType: { equals: 'initial-sync' },
      status: { equals: 'pending' },
    },
    limit: 1,
  })

  if (jobs.docs.length === 0) return

  const job = jobs.docs[0]
  await payload.update({
    collection: 'ai-sync-queue',
    id: job.id,
    data: { status: 'processing' },
  })

  try {
    await runInitialSync(payload, pluginOptions, pluginOptions.enabledCollections)
    await payload.update({
      collection: 'ai-sync-queue',
      id: job.id,
      data: { status: 'completed', processedAt: new Date().toISOString() },
    })
  } catch (error: any) {
    payload.logger.error(`[scrape-ai] Initial sync failed: ${error.message}`)
    await payload.update({
      collection: 'ai-sync-queue',
      id: job.id,
      data: { status: 'failed', errorMessage: error.message },
    })
  }
}

async function processEnrichJobs(
  payload: Payload,
  aiProvider: IAiProvider,
): Promise<void> {
  const pendingJobs = await payload.find({
    collection: 'ai-sync-queue',
    where: {
      jobType: { equals: 'enrich-document' },
      status: { equals: 'pending' },
    },
    limit: 10,
    sort: 'createdAt',
  })

  for (const job of pendingJobs.docs) {
    try {
      // Mark as processing
      await payload.update({
        collection: 'ai-sync-queue',
        id: job.id,
        data: { status: 'processing' },
      })

      const typedJob = job as unknown as AiSyncQueueDoc
      const sourceCollection = typedJob.sourceCollection
      const sourceDocId = typedJob.sourceDocId

      if (!sourceCollection || !sourceDocId) {
        await payload.update({
          collection: 'ai-sync-queue',
          id: job.id,
          data: { status: 'failed', errorMessage: 'Missing sourceCollection or sourceDocId' },
        })
        continue
      }

      // Find the ai-content entry
      const contentResult = await payload.find({
        collection: 'ai-content',
        where: {
          sourceCollection: { equals: sourceCollection },
          sourceDocId: { equals: sourceDocId },
        },
        limit: 1,
      })

      if (contentResult.docs.length === 0) {
        await payload.update({
          collection: 'ai-sync-queue',
          id: job.id,
          data: { status: 'completed', processedAt: new Date().toISOString() },
        })
        continue
      }

      const contentEntry = contentResult.docs[0] as unknown as AiContentDoc
      const markdown = contentEntry.markdown

      if (!markdown) {
        await payload.update({
          collection: 'ai-sync-queue',
          id: job.id,
          data: { status: 'completed', processedAt: new Date().toISOString() },
        })
        continue
      }

      // Run AI enrichment
      const aiMeta = await enrichDocument(markdown, aiProvider)

      // Update the ai-content entry with AI metadata
      await payload.update({
        collection: 'ai-content',
        id: contentEntry.id,
        data: { aiMeta },
      })

      // Increment API call counter
      try {
        const aiConfig = await payload.findGlobal({ slug: 'ai-config' }) as unknown as AiConfigGlobal
        const currentCount = aiConfig?.aiApiCallCount || 0
        await payload.updateGlobal({
          slug: 'ai-config',
          data: { aiApiCallCount: currentCount + 3 }, // 3 calls per enrichment (summary, entities, chunks)
        })
      } catch {
        // Non-critical
      }

      await payload.update({
        collection: 'ai-sync-queue',
        id: job.id,
        data: { status: 'completed', processedAt: new Date().toISOString() },
      })
    } catch (error: any) {
      payload.logger.error(`[scrape-ai] Enrich job failed: ${error.message}`)
      await payload.update({
        collection: 'ai-sync-queue',
        id: job.id,
        data: { status: 'failed', errorMessage: error.message },
      })
    }
  }
}

async function processRebuildJobs(
  payload: Payload,
  pluginOptions: ResolvedPluginConfig,
): Promise<void> {
  const pendingJobs = await payload.find({
    collection: 'ai-sync-queue',
    where: {
      jobType: { equals: 'rebuild-aggregates' },
      status: { equals: 'pending' },
    },
    limit: 100,
  })

  if (pendingJobs.docs.length === 0) return

  // Mark all as processing
  for (const job of pendingJobs.docs) {
    await payload.update({
      collection: 'ai-sync-queue',
      id: job.id,
      data: { status: 'processing' },
    })
  }

  try {
    // Generate all aggregates in one pass
    const [llmsTxt, llmsFullTxt, sitemap] = await Promise.all([
      generateLlmsTxt({
        payload,
        siteUrl: pluginOptions.siteUrl,
        siteName: pluginOptions.siteName,
        siteDescription: pluginOptions.siteDescription,
      }),
      generateLlmsFullTxt({
        payload,
        siteUrl: pluginOptions.siteUrl,
        siteName: pluginOptions.siteName,
        siteDescription: pluginOptions.siteDescription,
      }),
      generateAiSitemap({
        payload,
        siteUrl: pluginOptions.siteUrl,
        siteName: pluginOptions.siteName,
      }),
    ])

    // Upsert aggregate entries
    await upsertAggregate(payload, '__llms-txt', 'llms.txt', llmsTxt)
    await upsertAggregate(payload, '__llms-full-txt', 'llms-full.txt', llmsFullTxt)
    await upsertAggregate(payload, '__sitemap-json', 'sitemap.json', JSON.stringify(sitemap, null, 2))

    // Update last rebuild timestamp
    await payload.updateGlobal({
      slug: 'ai-config',
      data: { lastAggregateRebuild: new Date().toISOString() },
    })

    // Mark all jobs as completed
    for (const job of pendingJobs.docs) {
      await payload.update({
        collection: 'ai-sync-queue',
        id: job.id,
        data: { status: 'completed', processedAt: new Date().toISOString() },
      })
    }
  } catch (error: any) {
    payload.logger.error(`[scrape-ai] Aggregate rebuild failed: ${error.message}`)
    for (const job of pendingJobs.docs) {
      await payload.update({
        collection: 'ai-sync-queue',
        id: job.id,
        data: { status: 'failed', errorMessage: error.message },
      })
    }
  }
}

async function cleanupOldJobs(payload: Payload): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const oldJobs = await payload.find({
      collection: 'ai-sync-queue',
      where: {
        status: { in: ['completed', 'failed'] },
        createdAt: { less_than: cutoff },
      },
      limit: 100,
    })

    if (oldJobs.docs.length > 0) {
      for (const job of oldJobs.docs) {
        await payload.delete({ collection: 'ai-sync-queue', id: job.id })
      }
    }
  } catch {
    // Non-critical cleanup
  }
}

async function upsertAggregate(
  payload: Payload,
  sourceDocId: string,
  title: string,
  content: string,
): Promise<void> {
  const existing = await payload.find({
    collection: 'ai-content',
    where: {
      sourceCollection: { equals: '__aggregate' },
      sourceDocId: { equals: sourceDocId },
    },
    limit: 1,
  })

  const data = {
    sourceCollection: '__aggregate',
    sourceDocId,
    slug: sourceDocId,
    title,
    markdown: content,
    status: 'synced' as const,
    lastSynced: new Date().toISOString(),
  }

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'ai-content',
      id: existing.docs[0].id,
      data,
    })
  } else {
    await payload.create({
      collection: 'ai-content',
      data,
    })
  }
}
