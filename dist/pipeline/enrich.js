"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichContent = enrichContent;
const summarize_1 = require("../ai/summarize");
const entities_1 = require("../ai/entities");
const chunk_1 = require("../ai/chunk");
/**
 * Stage 3: Optional AI enrichment.
 * Generates summary, topics, entities, and semantic chunks.
 * Gracefully handles partial failures — partial AI meta is better than none.
 */
async function enrichContent(markdown, provider) {
    const results = await Promise.allSettled([
        (0, summarize_1.generateSummary)(markdown, provider),
        (0, entities_1.extractEntities)(markdown, provider),
        (0, chunk_1.semanticChunk)(markdown, provider),
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
//# sourceMappingURL=enrich.js.map