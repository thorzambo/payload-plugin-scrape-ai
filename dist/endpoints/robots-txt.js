/**
 * Returns the AI discovery additions for robots.txt.
 * GET /api/scrape-ai/robots-txt
 */
export function createRobotsTxtEndpoint(siteUrl) {
    return {
        path: '/scrape-ai/robots-txt',
        method: 'get',
        handler: async (req) => {
            return new Response(getAiRobotsTxtBlock(siteUrl), {
                status: 200,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
        },
    };
}
function getAiRobotsTxtBlock(siteUrl) {
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
    ].join('\n');
}
//# sourceMappingURL=robots-txt.js.map