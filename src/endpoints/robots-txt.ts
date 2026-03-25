import type { PayloadRequest } from 'payload'

/**
 * Returns the AI discovery additions for robots.txt.
 * GET /api/scrape-ai/robots-txt
 */
export function createRobotsTxtEndpoint(siteUrl: string) {
  return {
    path: '/scrape-ai/robots-txt',
    method: 'get' as const,
    handler: async (req: PayloadRequest) => {
      return new Response(getAiRobotsTxtBlock(siteUrl), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      })
    },
  }
}


function getAiRobotsTxtBlock(siteUrl: string): string {
  return [
    '# AI Content Discovery — payload-plugin-scrape-ai',
    `# Entry point: ${siteUrl}/llms.txt`,
    '',
    `Sitemap: ${siteUrl}/ai/sitemap.xml`,
    `Sitemap: ${siteUrl}/ai/sitemap.json`,
    '',
    'User-agent: *',
    'Allow: /llms.txt',
    'Allow: /llms-full.txt',
    'Allow: /ai/',
    'Allow: /.well-known/ai-plugin.json',
  ].join('\n')
}
