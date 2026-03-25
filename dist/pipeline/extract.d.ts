import type { CollectionConfig, Payload } from 'payload';
/**
 * Stage 1: Extract document content into clean markdown.
 * Traverses all fields recursively, converting each type to markdown.
 */
export declare function extractDocument(doc: Record<string, unknown>, collectionConfig: CollectionConfig, payload: Payload): string;
//# sourceMappingURL=extract.d.ts.map