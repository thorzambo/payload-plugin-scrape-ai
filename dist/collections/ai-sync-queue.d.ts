/**
 * AI Sync Queue — background job queue for content processing.
 *
 * Production: create compound index on (jobType, status) for optimal query performance:
 *   db['ai-sync-queue'].createIndex({ jobType: 1, status: 1 })
 */
import type { CollectionConfig } from 'payload';
import type { CollectionOverrides } from '../types';
export declare function createAiSyncQueueCollection(overrides?: CollectionOverrides): CollectionConfig;
//# sourceMappingURL=ai-sync-queue.d.ts.map