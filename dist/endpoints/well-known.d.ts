import type { PayloadRequest } from 'payload';
/**
 * /.well-known/ai-plugin.json discovery manifest.
 * Standard discovery endpoint that AI agents and crawlers check.
 * Also served at /api/scrape-ai/well-known (the rewrite target).
 */
export declare function createWellKnownEndpoint(siteUrl: string): {
    path: string;
    method: "get";
    handler: (req: PayloadRequest) => Promise<Response>;
};
//# sourceMappingURL=well-known.d.ts.map