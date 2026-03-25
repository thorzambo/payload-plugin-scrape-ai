/**
 * Renders AI discovery tags in the <head> section.
 *
 * NOTE: For Next.js App Router, prefer `generateAiMetadata` from this package —
 * it integrates with Next.js's built-in Metadata API and is the recommended approach:
 *
 *   import { generateAiMetadata } from 'payload-plugin-scrape-ai/discovery'
 *   export const metadata = { ...generateAiMetadata('https://your-site.com') }
 *
 * Use `ScrapeAiMeta` for Next.js Pages Router (_document.tsx) or any other
 * framework where you control the <head> directly.
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