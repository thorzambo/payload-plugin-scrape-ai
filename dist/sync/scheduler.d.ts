import type { Payload } from 'payload';
import type { ResolvedPluginConfig } from '../types';
/**
 * Start the background scheduler that processes the sync queue
 * and handles error recovery.
 */
export declare function startScheduler(payload: Payload, pluginOptions: ResolvedPluginConfig): () => void;
//# sourceMappingURL=scheduler.d.ts.map