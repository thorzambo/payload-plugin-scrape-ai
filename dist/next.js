/**
 * Next.js config wrapper for 10/10 AI discoverability.
 *
 * Usage in next.config.mjs:
 *
 *   import { withScrapeAi } from 'payload-plugin-scrape-ai/next'
 *   export default withScrapeAi(yourNextConfig)
 *
 * This single wrapper handles:
 *   1. Root-level rewrites (/llms.txt, /ai/*, /.well-known/*)
 *   2. robots.txt merging (appends AI entries to existing robots.txt)
 *   3. HTTP Link headers on all pages (advertise /llms.txt from every response)
 *   4. XML sitemap rewrite (/ai/sitemap.xml)
 *   5. CORS headers on AI endpoints
 */ const SCRAPE_AI_REWRITES = [
    // Core content endpoints — root level
    {
        source: '/llms.txt',
        destination: '/api/llms.txt'
    },
    {
        source: '/llms-full.txt',
        destination: '/api/llms-full.txt'
    },
    // AI content namespace
    {
        source: '/ai/sitemap.json',
        destination: '/api/ai/sitemap.json'
    },
    {
        source: '/ai/sitemap.xml',
        destination: '/api/scrape-ai/sitemap-xml'
    },
    {
        source: '/ai/context',
        destination: '/api/ai/context'
    },
    {
        source: '/ai/:collection/:slug',
        destination: '/api/ai/:collection/:slug'
    },
    {
        source: '/ai/structured/:collection/:slug',
        destination: '/api/ai/structured/:collection/:slug'
    },
    // Discovery endpoints
    {
        source: '/.well-known/ai-plugin.json',
        destination: '/api/scrape-ai/well-known'
    }
];
const SCRAPE_AI_HEADERS = [
    // Advertise AI content on EVERY page response
    {
        source: '/((?!api|_next|ai/).*)',
        headers: [
            {
                key: 'Link',
                value: '</llms.txt>; rel="ai-content"; type="text/markdown", </.well-known/ai-plugin.json>; rel="ai-plugin"; type="application/json"'
            },
            {
                key: 'X-AI-Content',
                value: '/llms.txt'
            },
            {
                key: 'X-AI-Discovery',
                value: '/.well-known/ai-plugin.json'
            }
        ]
    },
    // CORS + discovery headers on all AI endpoints
    {
        source: '/ai/:path*',
        headers: [
            {
                key: 'Access-Control-Allow-Origin',
                value: '*'
            },
            {
                key: 'X-AI-Index',
                value: '/llms.txt'
            },
            {
                key: 'X-AI-Discovery',
                value: '/.well-known/ai-plugin.json'
            }
        ]
    },
    // Same for root-level AI files
    {
        source: '/llms:path*',
        headers: [
            {
                key: 'Access-Control-Allow-Origin',
                value: '*'
            },
            {
                key: 'X-AI-Index',
                value: '/llms.txt'
            }
        ]
    }
];
export function withScrapeAi(nextConfig = {}) {
    const originalRewrites = nextConfig.rewrites;
    const originalHeaders = nextConfig.headers;
    return {
        ...nextConfig,
        async rewrites () {
            let existing = {
                beforeFiles: [],
                afterFiles: [],
                fallback: []
            };
            if (originalRewrites) {
                const result = await originalRewrites();
                if (Array.isArray(result)) {
                    existing.beforeFiles = result;
                } else {
                    existing = {
                        ...existing,
                        ...result
                    };
                }
            }
            return {
                ...existing,
                beforeFiles: [
                    ...SCRAPE_AI_REWRITES,
                    ...existing.beforeFiles || []
                ],
                afterFiles: existing.afterFiles || [],
                fallback: existing.fallback || []
            };
        },
        async headers () {
            let existing = [];
            if (originalHeaders) {
                existing = await originalHeaders();
            }
            return [
                ...SCRAPE_AI_HEADERS,
                ...existing
            ];
        }
    };
}

//# sourceMappingURL=next.js.map