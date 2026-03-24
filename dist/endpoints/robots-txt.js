import * as fs from 'fs';
import * as path from 'path';
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
/**
 * Merged robots.txt: reads the site's existing public/robots.txt
 * and appends AI discovery entries.
 * Served at /robots.txt via the withScrapeAi rewrite.
 * GET /api/scrape-ai/robots-txt-merged
 */
export function createMergedRobotsTxtEndpoint(siteUrl) {
    return {
        path: '/scrape-ai/robots-txt-merged',
        method: 'get',
        handler: async (req) => {
            let existingRobots = '';
            // Try to read existing robots.txt from common locations
            const possiblePaths = [
                path.join(process.cwd(), 'public', 'robots.txt'),
                path.join(process.cwd(), 'static', 'robots.txt'),
            ];
            for (const p of possiblePaths) {
                try {
                    existingRobots = fs.readFileSync(p, 'utf-8');
                    break;
                }
                catch {
                    // File doesn't exist, continue
                }
            }
            // If no existing robots.txt, create a sensible default
            if (!existingRobots.trim()) {
                existingRobots = [
                    'User-agent: *',
                    'Allow: /',
                    '',
                ].join('\n');
            }
            // Append AI discovery block
            const merged = [
                existingRobots.trim(),
                '',
                getAiRobotsTxtBlock(siteUrl),
            ].join('\n');
            return new Response(merged, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'public, max-age=3600',
                },
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