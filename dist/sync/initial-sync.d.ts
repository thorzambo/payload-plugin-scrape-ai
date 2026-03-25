import type { Payload } from 'payload';
import type { ResolvedPluginConfig } from '../types';
/**
 * Run initial sync on first plugin start.
 * Scans all enabled collections and creates ai-content entries.
 */
export declare function runInitialSync(payload: Payload, pluginOptions: ResolvedPluginConfig, enabledCollections: string[]): Promise<void>;
//# sourceMappingURL=initial-sync.d.ts.map