import type { AiProviderConfig, IAiProvider } from '../types';
/**
 * Create an AI provider from config. Returns null if SDK is not installed.
 */
export declare function createAiProvider(config: AiProviderConfig): IAiProvider | null;
/**
 * Try to create provider from runtime config (ai-config global),
 * falling back to plugin options.
 */
export declare function resolveAiProvider(pluginAiConfig?: AiProviderConfig, globalConfig?: {
    aiEnabled: boolean;
    aiProvider?: string;
    aiApiKey?: string;
    aiModel?: string;
}): IAiProvider | null;
//# sourceMappingURL=provider.d.ts.map