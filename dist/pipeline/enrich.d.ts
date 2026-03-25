import type { IAiProvider, AiMeta } from '../types';
/**
 * Stage 3: Optional AI enrichment.
 * Generates summary, topics, entities, and semantic chunks.
 * Gracefully handles partial failures — partial AI meta is better than none.
 */
export declare function enrichContent(markdown: string, provider: IAiProvider): Promise<AiMeta>;
//# sourceMappingURL=enrich.d.ts.map