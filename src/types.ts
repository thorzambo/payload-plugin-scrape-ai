import type { CollectionConfig, Config, GlobalConfig, Payload, PayloadRequest } from 'payload'

// --- Plugin Options ---

export interface AiProviderConfig {
  provider: 'openai' | 'anthropic'
  apiKey: string
  model?: string
}

export interface SyncConfig {
  debounceMs?: number
  initialSyncConcurrency?: number
  rateLimitPerMinute?: number
}

export interface ScrapeAiPluginOptions {
  collections?: string[]
  exclude?: string[]
  ai?: AiProviderConfig
  sync?: SyncConfig
  siteUrl: string
  siteName?: string
  siteDescription?: string
  drafts?: 'published-only' | 'include-drafts'
  enabled?: boolean
}

// --- Resolved internal config (after detection + defaults) ---

export interface ResolvedPluginConfig {
  enabledCollections: string[]
  siteUrl: string
  siteName: string
  siteDescription: string
  drafts: 'published-only' | 'include-drafts'
  sync: Required<SyncConfig>
  ai?: AiProviderConfig
}

// --- Data types for plugin-owned collections ---

export interface AiContentDoc {
  id: string
  sourceCollection: string
  sourceDocId: string
  slug: string
  title: string
  markdown?: string
  jsonLd?: Record<string, unknown>
  status: 'pending' | 'processing' | 'synced' | 'error' | 'error-permanent'
  errorMessage?: string
  retryCount: number
  aiMeta?: AiMeta
  parentSlug?: string
  relatedSlugs?: string[]
  locale?: string
  isDraft: boolean
  lastSynced?: string
  createdAt: string
  updatedAt: string
}

export interface AiSyncQueueDoc {
  id: string
  jobType: 'rebuild-aggregates' | 'sync-document' | 'enrich-document' | 'initial-sync'
  sourceCollection?: string
  sourceDocId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  processedAt?: string
  errorMessage?: string
}

export interface AiConfigGlobal {
  enabledCollections: Record<string, boolean>
  aiEnabled: boolean
  aiProvider?: 'openai' | 'anthropic'
  aiApiKey?: string
  aiModel?: string
  llmsTxtPriority: Array<{ slug: string; section: string; optional: boolean }>
  llmsTxtSections: Array<{ name: string; label: string }>
  aiApiCallCount: number
  aiApiCallCountResetDate?: string
  lastAggregateRebuild?: string
}

// --- Pipeline types ---

export interface AiMeta {
  summary?: string
  topics?: string[]
  entities?: string[]
  category?: string
  chunks?: Array<{ id: string; topic: string; content: string }>
}

export interface TransformResult {
  markdown: string
  title: string
  slug: string
  urlSlug: string
  parentSlug?: string
  relatedSlugs: string[]
  jsonLd: Record<string, unknown>
  isDraft: boolean
  locale?: string
}

export interface PipelineContext {
  doc: Record<string, unknown>
  collectionSlug: string
  collectionConfig: CollectionConfig
  payload: Payload
  pluginOptions: ResolvedPluginConfig
}

// --- AI Provider interface ---

export interface IAiProvider {
  complete(prompt: string, systemPrompt: string): Promise<string>
}

// --- Context query types ---

export interface ContextQueryResult {
  title: string
  slug: string
  collection: string
  url: string
  canonicalUrl: string
  excerpt: string
  summary?: string
  topics?: string[]
  relevanceScore: number
}

export interface ContextQueryResponse {
  query: string
  results: ContextQueryResult[]
  totalResults: number
}
