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
//# sourceMappingURL=robots-txt.d.ts.map