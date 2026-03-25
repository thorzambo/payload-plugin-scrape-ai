import type { CollectionAfterDeleteHook } from 'payload';
import type { ResolvedPluginConfig } from '../types';
/**
 * Creates an afterDelete hook that removes the corresponding ai-content entry
 * and queues an aggregate rebuild.
 */
export declare function createAfterDeleteHook(pluginOptions: ResolvedPluginConfig): CollectionAfterDeleteHook;
//# sourceMappingURL=afterDelete.d.ts.map