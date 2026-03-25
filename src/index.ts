import type { Config, Plugin } from 'payload'
import type { ScrapeAiPluginOptions, ResolvedPluginConfig, AiConfigGlobal } from './types'
import { en } from './translations/en'
import { createAiContentCollection } from './collections/ai-content'
import { createAiSyncQueueCollection } from './collections/ai-sync-queue'
import { createAiAggregatesCollection } from './collections/ai-aggregates'
import { aiConfigGlobal } from './globals/ai-config'
import { detectContentCollections } from './detection/smart-detect'
import { createAfterChangeHook } from './hooks/afterChange'
import { createAfterDeleteHook } from './hooks/afterDelete'
import { createLlmsTxtEndpoint } from './endpoints/llms-txt'
import { createLlmsFullTxtEndpoint } from './endpoints/llms-full-txt'
import { createContentMarkdownEndpoint } from './endpoints/content-markdown'
import { createSitemapJsonEndpoint } from './endpoints/sitemap-json'
import { createStructuredDataEndpoint } from './endpoints/structured-data'
import { createContextQueryEndpoint } from './endpoints/context-query'
import { createAdminEndpoints } from './endpoints/admin-api'
import { createWellKnownEndpoint } from './endpoints/well-known'
import { createRobotsTxtEndpoint } from './endpoints/robots-txt'
import { createSitemapXmlEndpoint } from './endpoints/sitemap-xml'
import { withHeadSupport } from './endpoints/head-support'
import { RateLimiter } from './endpoints/rate-limiter'
import { startScheduler } from './sync/scheduler'

export type { ScrapeAiPluginOptions } from './types'
export { generateHeadTags, getDiscoveryLinks, generateAiMetadata } from './discovery/head-tags'
export { ScrapeAiMeta } from './discovery/ScrapeAiMeta'
export { ScrapeAiFooterTag } from './discovery/ScrapeAiFooterTag'
export { withScrapeAi } from './next'

export const scrapeAiPlugin =
  (options: ScrapeAiPluginOptions): Plugin =>
  (incomingConfig: Config): Config => {
    if (!options.siteUrl) {
      throw new Error('[scrape-ai] siteUrl is required. Please provide the base URL of your website.')
    }

    const config = { ...incomingConfig }

    const resolvedConfig: ResolvedPluginConfig = {
      enabledCollections: [], // resolved in onInit
      siteUrl: options.siteUrl.replace(/\/$/, ''),
      siteName: options.siteName || 'My Website',
      siteDescription: options.siteDescription || '',
      drafts: options.drafts || 'published-only',
      sync: {
        debounceMs: options.sync?.debounceMs ?? 30000,
        initialSyncConcurrency: options.sync?.initialSyncConcurrency ?? 5,
        rateLimitPerMinute: options.sync?.rateLimitPerMinute ?? 60,
      },
      ai: options.ai,
    }

    // Always add collections and global for schema consistency
    config.collections = [
      ...(config.collections || []),
      createAiContentCollection(options.aiContentOverrides),
      createAiSyncQueueCollection(options.aiSyncQueueOverrides),
      createAiAggregatesCollection(options.aiAggregatesOverrides),
    ]
    config.globals = [
      ...(config.globals || []),
      aiConfigGlobal,
    ]

    if (options.enabled === false) return config

    // --- Detect target collections ---
    const detectedCollections = detectContentCollections(config, options)
    resolvedConfig.enabledCollections = detectedCollections

    // --- Inject hooks into target collections ---
    config.collections = config.collections.map((collection) => {
      if (!detectedCollections.includes(collection.slug)) return collection

      return {
        ...collection,
        hooks: {
          ...collection.hooks,
          afterChange: [
            ...(collection.hooks?.afterChange || []),
            createAfterChangeHook(resolvedConfig, collection),
          ],
          afterDelete: [
            ...(collection.hooks?.afterDelete || []),
            createAfterDeleteHook(resolvedConfig),
          ],
        },
      }
    })

    // --- Register public endpoints ---
    const rateLimiter = new RateLimiter(resolvedConfig.sync.rateLimitPerMinute)

    // All public AI endpoints get HEAD support (ChatGPT/Perplexity send HEAD first)
    const publicEndpoints = [
      createLlmsTxtEndpoint(rateLimiter),
      createLlmsFullTxtEndpoint(rateLimiter),
      createSitemapJsonEndpoint(rateLimiter),
      createContentMarkdownEndpoint(rateLimiter),
      createStructuredDataEndpoint(rateLimiter),
      createContextQueryEndpoint(rateLimiter, resolvedConfig.siteUrl),
      createWellKnownEndpoint(resolvedConfig.siteUrl),
      createRobotsTxtEndpoint(resolvedConfig.siteUrl),
      createSitemapXmlEndpoint(resolvedConfig.siteUrl),
    ]

    config.endpoints = [
      ...(config.endpoints ?? []),
      ...publicEndpoints.flatMap((ep) => withHeadSupport(ep)),
      ...createAdminEndpoints(resolvedConfig, options),
    ]

    // --- Register admin view ---
    config.admin = {
      ...(config.admin || {}),
      components: {
        ...(config.admin?.components || {}),
        views: {
          ...(config.admin?.components?.views || {}),
          scrapeAi: {
            Component: 'payload-plugin-scrape-ai/rsc#ScrapeAiView',
            path: '/scrape-ai',
          },
        },
        afterNavLinks: [
          ...((config.admin?.components?.afterNavLinks as any[]) || []),
          'payload-plugin-scrape-ai/NavLink#default',
        ],
      },
    }

    // --- Merge i18n translations ---
    config.i18n = {
      ...config.i18n,
      translations: {
        ...config.i18n?.translations,
        en: {
          ...(config.i18n?.translations?.en || {}),
          ...en,
        },
      },
    }

    // --- Extend onInit ---
    const existingOnInit = incomingConfig.onInit
    config.onInit = async (payload) => {
      if (existingOnInit) await existingOnInit(payload)

      payload.logger.info('[scrape-ai] Plugin initializing...')

      // Initialize enabled collections in ai-config global
      try {
        const aiConfig = await payload.findGlobal({ slug: 'ai-config' }) as unknown as AiConfigGlobal
        const currentEnabled = aiConfig?.enabledCollections || {}
        const needsUpdate = detectedCollections.some((slug) => currentEnabled[slug] === undefined)

        if (needsUpdate) {
          const updated = { ...currentEnabled }
          for (const slug of detectedCollections) {
            if (updated[slug] === undefined) {
              updated[slug] = true
            }
          }
          await payload.updateGlobal({
            slug: 'ai-config',
            data: { enabledCollections: updated },
          })
        }
      } catch (error: any) {
        payload.logger.warn(`[scrape-ai] Could not initialize ai-config: ${error.message}`)
      }

      // Queue initial sync (non-blocking)
      await payload.create({
        collection: 'ai-sync-queue',
        data: { jobType: 'initial-sync', status: 'pending' },
      })

      // Start background scheduler
      const stopScheduler = startScheduler(payload, resolvedConfig)

      // Register cleanup on process exit (once to prevent listener accumulation)
      process.once('beforeExit', () => stopScheduler())
      process.once('SIGTERM', () => { stopScheduler(); process.exit(0) })
      process.once('SIGINT', () => { stopScheduler(); process.exit(0) })

      payload.logger.info('[scrape-ai] Plugin initialized successfully')
    }

    return config
  }
