/**
 * Generate HTML <link> and <meta> tags for AI content discoverability.
 * Site owners should add these to their <head> section.
 *
 * These tags allow AI agents to discover the content index
 * from any page on the site, following the same pattern as
 * robots.txt, sitemap.xml, and RSS feed discovery.
 */ export function generateHeadTags(siteUrl) {
    return [
        `<!-- AI Content Discovery - payload-plugin-scrape-ai -->`,
        `<link rel="ai-content" href="${siteUrl}/llms.txt" type="text/markdown" title="AI Content Index">`,
        `<link rel="ai-content-full" href="${siteUrl}/llms-full.txt" type="text/markdown" title="Full AI Content">`,
        `<link rel="ai-sitemap" href="${siteUrl}/ai/sitemap.json" type="application/json" title="AI Sitemap">`,
        `<meta name="ai-content-index" content="${siteUrl}/llms.txt">`,
        `<meta name="ai-plugin" content="${siteUrl}/.well-known/ai-plugin.json">`
    ].join('\n');
}
/**
 * Generate Next.js Metadata object for AI discovery.
 *
 * Preferred approach for Next.js App Router — spread into your layout's metadata export
 * or merge into generateMetadata(). ScrapeAiMeta is available for Pages Router or
 * manual <head> injection.
 *
 * Usage in app/layout.tsx:
 *   import { generateAiMetadata } from 'payload-plugin-scrape-ai/discovery'
 *
 *   export const metadata = {
 *     ...generateAiMetadata('https://example.com'),
 *     title: 'My Site',
 *   }
 *
 *   // Or inside generateMetadata():
 *   export async function generateMetadata() {
 *     return { ...generateAiMetadata('https://example.com'), title: 'My Site' }
 *   }
 */ export function generateAiMetadata(siteUrl) {
    const url = siteUrl.replace(/\/$/, '');
    return {
        other: {
            'ai-content': `${url}/llms.txt`,
            'ai-content-full': `${url}/llms-full.txt`,
            'ai-sitemap': `${url}/ai/sitemap.json`,
            'ai-plugin': `${url}/.well-known/ai-plugin.json`
        },
        alternates: {
            types: {
                'text/plain': `${url}/llms.txt`,
                'application/json': `${url}/.well-known/ai-plugin.json`
            }
        }
    };
}
/**
 * Returns structured data for the head tags, useful for
 * programmatic insertion in React/Next.js apps.
 */ export function getDiscoveryLinks(siteUrl) {
    return [
        {
            rel: 'ai-content',
            href: `${siteUrl}/llms.txt`,
            type: 'text/markdown',
            title: 'AI Content Index'
        },
        {
            rel: 'ai-content-full',
            href: `${siteUrl}/llms-full.txt`,
            type: 'text/markdown',
            title: 'Full AI Content'
        },
        {
            rel: 'ai-sitemap',
            href: `${siteUrl}/ai/sitemap.json`,
            type: 'application/json',
            title: 'AI Sitemap'
        }
    ];
}

//# sourceMappingURL=head-tags.js.map