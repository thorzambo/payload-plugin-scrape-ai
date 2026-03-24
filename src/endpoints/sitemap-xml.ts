import type { PayloadRequest } from 'payload'

/**
 * Standard XML sitemap containing all AI content URLs.
 * Crawlers already understand this format — no special client needed.
 * Served at /ai/sitemap.xml via withScrapeAi rewrite.
 * GET /api/scrape-ai/sitemap-xml
 */
export function createSitemapXmlEndpoint(siteUrl: string) {
  return {
    path: '/scrape-ai/sitemap-xml',
    method: 'get' as const,
    handler: async (req: PayloadRequest) => {
      const { payload } = req

      try {
        // Query all synced non-aggregate entries
        const allContent = await payload.find({
          collection: 'ai-content',
          where: {
            sourceCollection: { not_equals: '__aggregate' },
            status: { equals: 'synced' },
          },
          limit: 10000,
          sort: '-lastSynced',
        })

        const urls: Array<{ loc: string; lastmod: string; priority: string }> = []

        // Root AI files — highest priority
        urls.push({
          loc: `${siteUrl}/llms.txt`,
          lastmod: new Date().toISOString(),
          priority: '1.0',
        })
        urls.push({
          loc: `${siteUrl}/llms-full.txt`,
          lastmod: new Date().toISOString(),
          priority: '0.9',
        })
        urls.push({
          loc: `${siteUrl}/ai/sitemap.json`,
          lastmod: new Date().toISOString(),
          priority: '0.8',
        })
        urls.push({
          loc: `${siteUrl}/.well-known/ai-plugin.json`,
          lastmod: new Date().toISOString(),
          priority: '0.7',
        })

        // Individual content pages
        for (const entry of allContent.docs) {
          const collection = (entry as any).sourceCollection as string
          const slug = (entry as any).slug as string
          const lastSynced = (entry as any).lastSynced as string

          urls.push({
            loc: `${siteUrl}/ai/${collection}/${slug}.md`,
            lastmod: lastSynced || new Date().toISOString(),
            priority: '0.6',
          })
        }

        // Build XML
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls.map(
            (u) =>
              `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`,
          ),
          '</urlset>',
        ].join('\n')

        return new Response(xml, {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      } catch (error: any) {
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
          { status: 200, headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
        )
      }
    },
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
