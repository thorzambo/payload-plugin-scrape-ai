/**
 * AI Content collection — stores generated content mirrors.
 *
 * Production: create compound index on (sourceCollection, sourceDocId)
 * for optimal query performance:
 *   db['ai-content'].createIndex({ sourceCollection: 1, sourceDocId: 1 })
 *
 * For very large sites (>1MB markdown per doc), consider external storage.
 * MongoDB's 16MB document limit applies to the full document.
 */
import type { CollectionConfig } from 'payload';
import type { CollectionOverrides } from '../types';
export declare function createAiContentCollection(overrides?: CollectionOverrides): CollectionConfig;
//# sourceMappingURL=ai-content.d.ts.map