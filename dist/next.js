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
const SCRAPE_AI_REWRITES = [
    { source: '/llms.txt', destination: '/api/llms.txt' },
    { source: '/llms-full.txt', destination: '/api/llms-full.txt' },
    { source: '/ai/sitemap.json', destination: '/api/ai/sitemap.json' },
    { source: '/ai/context', destination: '/api/ai/context' },
    { source: '/ai/:collection/:slug', destination: '/api/ai/:collection/:slug' },
    { source: '/ai/structured/:collection/:slug', destination: '/api/ai/structured/:collection/:slug' },
    { source: '/.well-known/ai-plugin.json', destination: '/api/scrape-ai/well-known' },
];
export function withScrapeAi(nextConfig = {}) {
    const originalRewrites = nextConfig.rewrites;
    return {
        ...nextConfig,
        async rewrites() {
            let existing = { beforeFiles: [], afterFiles: [], fallback: [] };
            if (originalRewrites) {
                const result = await originalRewrites();
                // Handle both array and object return formats
                if (Array.isArray(result)) {
                    existing.beforeFiles = result;
                }
                else {
                    existing = { ...existing, ...result };
                }
            }
            return {
                ...existing,
                beforeFiles: [
                    ...SCRAPE_AI_REWRITES,
                    ...(existing.beforeFiles || []),
                ],
                afterFiles: existing.afterFiles || [],
                fallback: existing.fallback || [],
            };
        },
    };
}
//# sourceMappingURL=next.js.map