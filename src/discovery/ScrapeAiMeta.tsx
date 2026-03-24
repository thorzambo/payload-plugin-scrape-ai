import React from 'react'

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
  siteUrl: string
  siteName?: string
  siteDescription?: string
}

export function ScrapeAiMeta({ siteUrl, siteName, siteDescription }: ScrapeAiMetaProps) {
  const url = siteUrl.replace(/\/$/, '')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName || url,
    url: url,
    description: siteDescription || undefined,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/ai/context?query={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    // Non-standard but parseable: advertise AI content
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'ai-content-index',
        value: `${url}/llms.txt`,
      },
      {
        '@type': 'PropertyValue',
        name: 'ai-content-full',
        value: `${url}/llms-full.txt`,
      },
      {
        '@type': 'PropertyValue',
        name: 'ai-discovery-manifest',
        value: `${url}/.well-known/ai-plugin.json`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <link rel="ai-content" href={`${url}/llms.txt`} type="text/markdown" title="AI Content Index" />
      <link rel="ai-content-full" href={`${url}/llms-full.txt`} type="text/markdown" title="Full AI Content" />
      <link rel="ai-sitemap" href={`${url}/ai/sitemap.json`} type="application/json" title="AI Sitemap" />
      <meta name="ai-content-index" content={`${url}/llms.txt`} />
      <meta name="ai-plugin" content={`${url}/.well-known/ai-plugin.json`} />
    </>
  )
}
