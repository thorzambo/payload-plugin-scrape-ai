/**
 * Renders an invisible-to-humans but visible-to-text-extractors section
 * containing AI content discovery information.
 *
 * WHY THIS EXISTS:
 * AI browsing tools (ChatGPT, Perplexity, etc.) extract rendered page text.
 * They don't check HTTP headers, robots.txt, or meta tags proactively.
 * This component puts discovery info IN the page text where extractors see it.
 *
 * The text is styled to be invisible to human visitors:
 * - 1px font size
 * - Color matches background
 * - Positioned off-screen for visual rendering
 * - But fully present in the DOM and extractable by any text parser
 *
 * Usage:
 *   import { ScrapeAiFooterTag } from 'payload-plugin-scrape-ai/discovery'
 *   <body>
 *     {children}
 *     <ScrapeAiFooterTag siteUrl="https://your-site.com" />
 *   </body>
 */
interface ScrapeAiFooterTagProps {
    siteUrl: string;
    siteName?: string;
}
export declare function ScrapeAiFooterTag({ siteUrl, siteName }: ScrapeAiFooterTagProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ScrapeAiFooterTag.d.ts.map