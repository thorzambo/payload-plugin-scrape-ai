import type { CollectionConfig } from 'payload';
import type { CollectionOverrides } from '../types';
/**
 * AI Aggregates — stores pre-generated aggregate content (llms.txt, sitemap, etc.)
 * Separated from ai-content to avoid polluting document queries.
 */
export declare function createAiAggregatesCollection(overrides?: CollectionOverrides): CollectionConfig;
//# sourceMappingURL=ai-aggregates.d.ts.map