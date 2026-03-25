import type { PayloadRequest } from 'payload';
/**
 * Standard XML sitemap containing all AI content URLs.
 * Crawlers already understand this format — no special client needed.
 * Served at /ai/sitemap.xml via withScrapeAi rewrite.
 * GET /api/scrape-ai/sitemap-xml
 */
export declare function createSitemapXmlEndpoint(siteUrl: string): {
    path: string;
    method: "get";
    handler: (req: PayloadRequest) => Promise<Response>;
};
//# sourceMappingURL=sitemap-xml.d.ts.map