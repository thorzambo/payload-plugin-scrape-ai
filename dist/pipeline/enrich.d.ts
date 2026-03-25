import type { IAiProvider, AiMeta } from '../types';
/**
 * Stage 3: Optional AI enrichment.
 * Generates summary, topics, entities, and semantic chunks.
 * Uses a single batched AI call; falls back to 3 individual calls on parse failure.
 */
export declare function enrichContent(markdown: string, aiProvider: IAiProvider): Promise<AiMeta>;
//# sourceMappingURL=enrich.d.ts.map