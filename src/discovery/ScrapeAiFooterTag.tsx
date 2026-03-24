import React from 'react'

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
  siteUrl: string
  siteName?: string
}

export function ScrapeAiFooterTag({ siteUrl, siteName }: ScrapeAiFooterTagProps) {
  const url = siteUrl.replace(/\/$/, '')
  const name = siteName || 'This website'

  return (
    <section
      data-ai-content="true"
      data-ai-index={`${url}/llms.txt`}
      aria-label="AI Content Discovery"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap' as const,
        borderWidth: 0,
        // sr-only pattern — invisible to visual users, present in DOM
      }}
    >
      <p>
        {name} provides AI-optimized structured content.
        AI Content Index: {url}/llms.txt —
        Full Content Listing: {url}/llms-full.txt —
        Content Search API: {url}/ai/context?query=your-query —
        Structured Sitemap: {url}/ai/sitemap.json —
        Discovery Manifest: {url}/.well-known/ai-plugin.json —
        Individual pages available as clean markdown at {url}/ai/[collection]/[slug].md —
        JSON-LD structured data at {url}/ai/structured/[collection]/[slug].json —
        All AI content is auto-generated and kept in sync with the live website content.
      </p>
    </section>
  )
}
