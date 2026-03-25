import type { Payload } from 'payload';
import type { ResolvedPluginConfig } from '../types';
/**
 * Retry errored ai-content entries.
 * Called periodically (every 5 minutes) by the scheduler.
 */
export declare function retryErrors(payload: Payload, pluginOptions: ResolvedPluginConfig): Promise<void>;
//# sourceMappingURL=error-recovery.d.ts.map