/**
 * Generate HTML <link> and <meta> tags for AI content discoverability.
 * Site owners should add these to their <head> section.
 *
 * These tags allow AI agents to discover the content index
 * from any page on the site, following the same pattern as
 * robots.txt, sitemap.xml, and RSS feed discovery.
 */
export declare function generateHeadTags(siteUrl: string): string;
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
 */
export declare function generateAiMetadata(siteUrl: string): Record<string, any>;
/**
 * Returns structured data for the head tags, useful for
 * programmatic insertion in React/Next.js apps.
 */
export declare function getDiscoveryLinks(siteUrl: string): Array<{
    rel: string;
    href: string;
    type: string;
    title: string;
}>;
//# sourceMappingURL=head-tags.d.ts.map