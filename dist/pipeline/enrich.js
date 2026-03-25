import { generateSummary } from '../ai/summarize';
import { extractEntities } from '../ai/entities';
import { semanticChunk } from '../ai/chunk';
/**
 * Fallback: 3 separate AI calls (summary, entities, chunks).
 * Used when the batched structured-output call fails.
 */
async function enrichContentFallback(markdown, provider) {
    const results = await Promise.allSettled([
        generateSummary(markdown, provider),
        extractEntities(markdown, provider),
        semanticChunk(markdown, provider),
    ]);
    const meta = {};
    // Summary
    if (results[0].status === 'fulfilled' && results[0].value) {
        meta.summary = results[0].value;
    }
    // Entities & topics
    if (results[1].status === 'fulfilled') {
        const entityResult = results[1].value;
        meta.topics = entityResult.topics;
        meta.entities = entityResult.entities;
        meta.category = entityResult.category;
    }
    // Chunks
    if (results[2].status === 'fulfilled' && results[2].value.length > 0) {
        meta.chunks = results[2].value;
    }
    return meta;
}
/**
 * Single batched AI call requesting all enrichment data as structured JSON.
 * Falls back to enrichContentFallback if parsing fails.
 */
async function enrichContentBatched(markdown, aiProvider) {
    const truncated = markdown.slice(0, 8000); // Enough for all three tasks
    const systemPrompt = `You are a content analysis assistant. Analyze the provided content and return a JSON object with exactly these fields:
- "summary": A concise 1-2 sentence summary (max 500 chars)
- "topics": An array of 3-8 key topic phrases
- "entities": An array of named entities (people, companies, places, max 20)
- "category": A single category label for this content
- "chunks": An array of 3-8 semantic chunks, each with "id" (string like "chunk-1"), "topic" (brief label), and "content" (the text segment)

Return ONLY valid JSON, no markdown code fences.`;
    const result = await aiProvider.complete(truncated, systemPrompt);
    try {
        // Try to parse the JSON response
        const cleaned = result.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
            summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 500) : undefined,
            topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 10) : [],
            entities: Array.isArray(parsed.entities) ? parsed.entities.slice(0, 20) : [],
            category: typeof parsed.category === 'string' ? parsed.category : 'General',
            chunks: Array.isArray(parsed.chunks)
                ? parsed.chunks.slice(0, 8).map((c, i) => ({
                    id: c.id || `chunk-${i + 1}`,
                    topic: c.topic || '',
                    content: c.content || '',
                }))
                : [],
        };
    }
    catch {
        // Fallback to individual calls if structured output fails
        return enrichContentFallback(markdown, aiProvider);
    }
}
/**
 * Stage 3: Optional AI enrichment.
 * Generates summary, topics, entities, and semantic chunks.
 * Uses a single batched AI call; falls back to 3 individual calls on parse failure.
 */
export async function enrichContent(markdown, aiProvider) {
    return enrichContentBatched(markdown, aiProvider);
}
//# sourceMappingURL=enrich.js.map