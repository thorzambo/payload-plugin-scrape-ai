/**
 * Renders AI discovery tags in the <head> section.
 * Add to your root layout's <head>.
 *
 * Usage:
 *   import { ScrapeAiMeta } from 'payload-plugin-scrape-ai/discovery'
 *   <head>
 *     <ScrapeAiMeta siteUrl="https://your-site.com" siteName="My Site" />
 *   </head>
 *
 * Renders:
 *   - JSON-LD WebSite schema with SearchAction
 *   - <link> tags for AI content discovery
 *   - <meta> tags for AI content index
 */
interface ScrapeAiMetaProps {
    siteUrl: string;
    siteName?: string;
    siteDescription?: string;
}
export declare function ScrapeAiMeta({ siteUrl, siteName, siteDescription }: ScrapeAiMetaProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ScrapeAiMeta.d.ts.map