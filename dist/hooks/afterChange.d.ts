import type { CollectionAfterChangeHook, CollectionConfig } from 'payload';
import type { ResolvedPluginConfig } from '../types';
/**
 * Creates an afterChange hook that runs Stage 1+2 synchronously,
 * then queues AI enrichment and aggregate rebuild asynchronously.
 */
export declare function createAfterChangeHook(pluginOptions: ResolvedPluginConfig, collectionConfig: CollectionConfig): CollectionAfterChangeHook;
//# sourceMappingURL=afterChange.d.ts.map