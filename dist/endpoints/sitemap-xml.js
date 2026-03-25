/**
 * Standard XML sitemap containing all AI content URLs.
 * Crawlers already understand this format — no special client needed.
 * Served at /ai/sitemap.xml via withScrapeAi rewrite.
 * GET /api/scrape-ai/sitemap-xml
 */
export function createSitemapXmlEndpoint(siteUrl) {
    return {
        path: '/scrape-ai/sitemap-xml',
        method: 'get',
        handler: async (req) => {
            const { payload } = req;
            try {
                const urls = [];
                // Root AI files — highest priority
                urls.push({
                    loc: `${siteUrl}/llms.txt`,
                    lastmod: new Date().toISOString(),
                    priority: '1.0',
                });
                urls.push({
                    loc: `${siteUrl}/llms-full.txt`,
                    lastmod: new Date().toISOString(),
                    priority: '0.9',
                });
                urls.push({
                    loc: `${siteUrl}/ai/sitemap.json`,
                    lastmod: new Date().toISOString(),
                    priority: '0.8',
                });
                urls.push({
                    loc: `${siteUrl}/.well-known/ai-plugin.json`,
                    lastmod: new Date().toISOString(),
                    priority: '0.7',
                });
                // Query all synced non-aggregate entries with pagination to handle large sites
                let page = 1;
                let hasMore = true;
                while (hasMore) {
                    const batch = await payload.find({
                        collection: 'ai-content',
                        where: {
                            status: { equals: 'synced' },
                        },
                        limit: 100,
                        page,
                        sort: '-lastSynced',
                    });
                    // Individual content pages
                    for (const entry of batch.docs) {
                        const collection = entry.sourceCollection;
                        const slug = entry.slug;
                        const lastSynced = entry.lastSynced;
                        urls.push({
                            loc: `${siteUrl}/ai/${collection}/${slug}.md`,
                            lastmod: lastSynced || new Date().toISOString(),
                            priority: '0.6',
                        });
                    }
                    hasMore = batch.hasNextPage;
                    page++;
                }
                // Build XML
                const xml = [
                    '<?xml version="1.0" encoding="UTF-8"?>',
                    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                    ...urls.map((u) => `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`),
                    '</urlset>',
                ].join('\n');
                return new Response(xml, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/xml; charset=utf-8',
                        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
                    },
                });
            }
            catch (error) {
                return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, { status: 200, headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
            }
        },
    };
}
function escapeXml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
//# sourceMappingURL=sitemap-xml.js.map