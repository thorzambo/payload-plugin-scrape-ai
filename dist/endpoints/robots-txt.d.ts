import type { PayloadRequest } from 'payload';
/**
 * Returns the AI discovery additions for robots.txt.
 * GET /api/scrape-ai/robots-txt
 */
export declare function createRobotsTxtEndpoint(siteUrl: string): {
    path: string;
    method: "get";
    handler: (req: PayloadRequest) => Promise<Response>;
};
/**
 * Merged robots.txt: reads the site's existing public/robots.txt
 * and appends AI discovery entries.
 * Served at /robots.txt via the withScrapeAi rewrite.
 * GET /api/scrape-ai/robots-txt-merged
 */
export declare function createMergedRobotsTxtEndpoint(siteUrl: string): {
    path: string;
    method: "get";
    handler: (req: PayloadRequest) => Promise<Response>;
};
//# sourceMappingURL=robots-txt.d.ts.map