import type { IAiProvider, AiMeta } from '../types'
import { generateSummary } from '../ai/summarize'
import { extractEntities } from '../ai/entities'
import { semanticChunk } from '../ai/chunk'

/**
 * Stage 3: Optional AI enrichment.
 * Generates summary, topics, entities, and semantic chunks.
 * Gracefully handles partial failures — partial AI meta is better than none.
 */
export async function enrichContent(
  markdown: string,
  provider: IAiProvider,
): Promise<AiMeta> {
  const results = await Promise.allSettled([
    generateSummary(markdown, provider),
    extractEntities(markdown, provider),
    semanticChunk(markdown, provider),
  ])

  const meta: AiMeta = {}

  // Summary
  if (results[0].status === 'fulfilled' && results[0].value) {
    meta.summary = results[0].value
  }

  // Entities & topics
  if (results[1].status === 'fulfilled') {
    const entityResult = results[1].value
    meta.topics = entityResult.topics
    meta.entities = entityResult.entities
    meta.category = entityResult.category
  }

  // Chunks
  if (results[2].status === 'fulfilled' && results[2].value.length > 0) {
    meta.chunks = results[2].value
  }

  return meta
}
