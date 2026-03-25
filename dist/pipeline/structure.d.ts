import type { CollectionConfig } from 'payload';
import type { TransformResult, AiContentDoc } from '../types';
/**
 * Stage 2: Add frontmatter, hierarchy, relationships, and JSON-LD to extracted markdown.
 */
export declare function structureContent(params: {
    markdown: string;
    doc: Record<string, unknown>;
    collectionSlug: string;
    collectionConfig: CollectionConfig;
    siteUrl: string;
    siteName: string;
    locale?: string;
    allContent?: Pick<AiContentDoc, 'slug' | 'sourceCollection' | 'title' | 'parentSlug'>[];
}): TransformResult;
export declare function toUrlSlug(slug: string): string;
export declare function inferParent(slug: string): string | undefined;
//# sourceMappingURL=structure.d.ts.map