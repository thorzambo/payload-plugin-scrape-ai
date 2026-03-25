/**
 * Generate JSON-LD structured data for a document.
 * Maps collection slugs to schema.org types.
 */
export declare function generateJsonLd(params: {
    title: string;
    slug: string;
    collection: string;
    siteUrl: string;
    siteName: string;
    description?: string;
    lastModified?: string;
    createdAt?: string;
    contentType?: string;
}): Record<string, unknown>;
//# sourceMappingURL=json-ld.d.ts.map