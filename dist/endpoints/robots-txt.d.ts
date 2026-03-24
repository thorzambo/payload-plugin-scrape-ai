import type { PayloadRequest } from 'payload';
/**
 * Endpoint that returns robots.txt content for AI discoverability.
 * Site owners should append this to their robots.txt or use the
 * generated text directly.
 *
 * GET /api/scrape-ai/robots-txt → returns the text to add
 */
export declare function createRobotsTxtEndpoint(siteUrl: string): {
    path: string;
    method: "get";
    handler: (req: PayloadRequest) => Promise<Response>;
};
//# sourceMappingURL=robots-txt.d.ts.map