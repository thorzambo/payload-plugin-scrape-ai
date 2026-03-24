import type { Config, Plugin } from 'payload'
import type { ScrapeAiPluginOptions, ResolvedPluginConfig } from './types'

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
      siteUrl: options.siteUrl.replace(/\/$/, ''), // strip trailing slash
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

    // Collections are always added (even if plugin is disabled) for schema consistency
    // They will be populated in subsequent tasks
    config.collections = [...(config.collections || [])]
    config.globals = [...(config.globals || [])]
    config.endpoints = [...(config.endpoints ?? [])]

    if (options.enabled === false) return config

    // Runtime features (hooks, endpoints, admin views, onInit) will be added in subsequent tasks
    // Store resolvedConfig for use by hooks and onInit via closure

    return config
  }
