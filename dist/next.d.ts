/**
 * Next.js config wrapper that adds root-level rewrites for AI discoverability.
 *
 * Usage in next.config.mjs:
 *
 *   import { withScrapeAi } from 'payload-plugin-scrape-ai/next'
 *   export default withScrapeAi(yourNextConfig)
 *
 * This maps:
 *   /llms.txt          → /api/llms.txt
 *   /llms-full.txt     → /api/llms-full.txt
 *   /ai/sitemap.json   → /api/ai/sitemap.json
 *   /ai/context        → /api/ai/context
 *   /ai/:path*         → /api/ai/:path*
 *   /.well-known/ai-plugin.json → /api/scrape-ai/well-known
 *
 * This is CRITICAL for AI discoverability. Without it, AI agents
 * can't find your content because /api/ paths are not standard
 * discovery locations.
 */
type NextConfig = {
    rewrites?: () => Promise<any> | any;
    [key: string]: any;
};
export declare function withScrapeAi(nextConfig?: NextConfig): NextConfig;
export {};
//# sourceMappingURL=next.d.ts.map