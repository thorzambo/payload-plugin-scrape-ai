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
 */
type NextConfig = {
    rewrites?: () => Promise<any> | any;
    headers?: () => Promise<any[]> | any[];
    [key: string]: any;
};
export declare function withScrapeAi(nextConfig?: NextConfig): NextConfig;
export {};
//# sourceMappingURL=next.d.ts.map