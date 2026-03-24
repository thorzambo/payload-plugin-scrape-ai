import type { CollectionConfig, Payload } from 'payload'
import type { ResolvedPluginConfig, TransformResult, AiMeta, IAiProvider, AiContentDoc } from '../types'
import { extractDocument } from './extract'
import { structureContent } from './structure'
import { enrichContent } from './enrich'

/**
 * Run Stage 1 + 2 of the pipeline (synchronous, fast, no AI).
 * Used in the afterChange hook — must be fast and never fail.
 */
export function transformDocument(params: {
  doc: Record<string, unknown>
  collectionSlug: string
  collectionConfig: CollectionConfig
  payload: Payload
  pluginOptions: ResolvedPluginConfig
  locale?: string
  allContent?: Pick<AiContentDoc, 'slug' | 'sourceCollection' | 'title' | 'parentSlug'>[]
}): TransformResult {
  const { doc, collectionSlug, collectionConfig, payload, pluginOptions, locale, allContent } = params

  // Stage 1: Extract
  const rawMarkdown = extractDocument(doc, collectionConfig, payload)

  // Stage 2: Structure
  const result = structureContent({
    markdown: rawMarkdown,
    doc,
    collectionSlug,
    collectionConfig,
    siteUrl: pluginOptions.siteUrl,
    siteName: pluginOptions.siteName,
    locale,
    allContent,
  })

  return result
}

/**
 * Run Stage 3 (AI enrichment). Called asynchronously via the queue.
 * Returns AI metadata to merge into the ai-content entry.
 */
export async function enrichDocument(
  markdown: string,
  aiProvider: IAiProvider,
): Promise<AiMeta> {
  return enrichContent(markdown, aiProvider)
}
