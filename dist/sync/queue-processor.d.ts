import type { Payload } from 'payload';
import type { ResolvedPluginConfig, IAiProvider } from '../types';
/**
 * Process pending jobs from the ai-sync-queue.
 */
export declare function processQueue(payload: Payload, pluginOptions: ResolvedPluginConfig, aiProvider: IAiProvider | null): Promise<void>;
//# sourceMappingURL=queue-processor.d.ts.map