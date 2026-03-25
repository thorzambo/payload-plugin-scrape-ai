import type { CollectionConfig, Payload } from 'payload';
import type { ResolvedPluginConfig, TransformResult, AiMeta, IAiProvider, AiContentDoc } from '../types';
/**
 * Run Stage 1 + 2 of the pipeline (synchronous, fast, no AI).
 * Used in the afterChange hook — must be fast and never fail.
 */
export declare function transformDocument(params: {
    doc: Record<string, unknown>;
    collectionSlug: string;
    collectionConfig: CollectionConfig;
    payload: Payload;
    pluginOptions: ResolvedPluginConfig;
    locale?: string;
    allContent?: Pick<AiContentDoc, 'slug' | 'sourceCollection' | 'title' | 'parentSlug'>[];
}): TransformResult;
/**
 * Run Stage 3 (AI enrichment). Called asynchronously via the queue.
 * Returns AI metadata to merge into the ai-content entry.
 */
export declare function enrichDocument(markdown: string, aiProvider: IAiProvider): Promise<AiMeta>;
//# sourceMappingURL=transform.d.ts.map