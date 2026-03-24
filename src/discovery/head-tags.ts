/**
 * Generate HTML <link> and <meta> tags for AI content discoverability.
 * Site owners should add these to their <head> section.
 *
 * These tags allow AI agents to discover the content index
 * from any page on the site, following the same pattern as
 * robots.txt, sitemap.xml, and RSS feed discovery.
 */
export function generateHeadTags(siteUrl: string): string {
  return [
    `<!-- AI Content Discovery - payload-plugin-scrape-ai -->`,
    `<link rel="ai-content" href="${siteUrl}/llms.txt" type="text/markdown" title="AI Content Index">`,
    `<link rel="ai-content-full" href="${siteUrl}/llms-full.txt" type="text/markdown" title="Full AI Content">`,
    `<link rel="ai-sitemap" href="${siteUrl}/ai/sitemap.json" type="application/json" title="AI Sitemap">`,
    `<meta name="ai-content-index" content="${siteUrl}/llms.txt">`,
    `<meta name="ai-plugin" content="${siteUrl}/.well-known/ai-plugin.json">`,
  ].join('\n')
}

/**
 * Returns structured data for the head tags, useful for
 * programmatic insertion in React/Next.js apps.
 */
export function getDiscoveryLinks(siteUrl: string): Array<{
  rel: string
  href: string
  type: string
  title: string
}> {
  return [
    {
      rel: 'ai-content',
      href: `${siteUrl}/llms.txt`,
      type: 'text/markdown',
      title: 'AI Content Index',
    },
    {
      rel: 'ai-content-full',
      href: `${siteUrl}/llms-full.txt`,
      type: 'text/markdown',
      title: 'Full AI Content',
    },
    {
      rel: 'ai-sitemap',
      href: `${siteUrl}/ai/sitemap.json`,
      type: 'application/json',
      title: 'AI Sitemap',
    },
  ]
}
