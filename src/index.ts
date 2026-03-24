import type { Config, Plugin } from 'payload'
import type { ScrapeAiPluginOptions, ResolvedPluginConfig } from './types'
import { aiContentCollection } from './collections/ai-content'
import { aiSyncQueueCollection } from './collections/ai-sync-queue'
import { aiConfigGlobal } from './globals/ai-config'

export type { ScrapeAiPluginOptions } from './types'

export const scrapeAiPlugin =
  (options: ScrapeAiPluginOptions): Plugin =>
  (incomingConfig: Config): Config => {
    if (!options.siteUrl) {
      throw new Error('[scrape-ai] siteUrl is required. Please provide the base URL of your website.')
    }

    const config = { ...incomingConfig }

    const resolvedConfig: ResolvedPluginConfig = {
      enabledCollections: [], // resolved in onInit after smart detection
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

    // Always add collections and global (even if disabled) for schema consistency
    config.collections = [
      ...(config.collections || []),
      aiContentCollection,
      aiSyncQueueCollection,
    ]
    config.globals = [
      ...(config.globals || []),
      aiConfigGlobal,
    ]
    config.endpoints = [...(config.endpoints ?? [])]

    if (options.enabled === false) return config

    // Runtime features (hooks, endpoints, admin views, onInit) added in subsequent tasks
    // resolvedConfig is captured by closure for use by hooks and onInit

    return config
  }
