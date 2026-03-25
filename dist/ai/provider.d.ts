import type { Payload } from 'payload';
import type { AiProviderConfig, IAiProvider } from '../types';
/**
 * Create an AI provider from config. Returns null if SDK is not installed.
 */
export declare function createAiProvider(config: AiProviderConfig): Promise<IAiProvider | null>;
export declare function resolveAiProvider(pluginAiConfig?: AiProviderConfig, globalConfig?: {
    aiEnabled: boolean;
    aiProvider?: string;
    aiModel?: string;
}): Promise<IAiProvider | null>;
export declare function resolveAiProviderFromPayload(payload: Payload, pluginAiConfig?: AiProviderConfig): Promise<IAiProvider | null>;
//# sourceMappingURL=provider.d.ts.map