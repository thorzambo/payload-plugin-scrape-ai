/**
 * /.well-known/ai-plugin.json discovery manifest.
 * Standard discovery endpoint that AI agents and crawlers check.
 * Also served at /api/scrape-ai/well-known (the rewrite target).
 */
export function createWellKnownEndpoint(siteUrl) {
    return {
        path: '/scrape-ai/well-known',
        method: 'get',
        handler: async (req) => {
            const manifest = {
                schema_version: 'v1',
                name_for_human: 'AI Content Index',
                name_for_model: 'ai_content_index',
                description_for_human: 'AI-friendly structured content for this website. Browse pages, search content, and access structured data.',
                description_for_model: 'This website provides AI-optimized content at the endpoints listed below. Start with /llms.txt for a curated index. Use /ai/context?query=... for semantic search. All content is structured markdown with YAML frontmatter.',
                api: {
                    type: 'openapi',
                    url: `${siteUrl}/.well-known/ai-plugin.json`,
                },
                endpoints: {
                    llms_txt: {
                        url: `${siteUrl}/llms.txt`,
                        description: 'Curated content index following the llms.txt standard. START HERE.',
                        content_type: 'text/markdown',
                    },
                    llms_full_txt: {
                        url: `${siteUrl}/llms-full.txt`,
                        description: 'Complete listing of all content, organized by collection.',
                        content_type: 'text/markdown',
                    },
                    sitemap: {
                        url: `${siteUrl}/ai/sitemap.json`,
                        description: 'Content relationship graph with hierarchy, topics, and metadata.',
                        content_type: 'application/json',
                    },
                    context_search: {
                        url: `${siteUrl}/ai/context?query={query}&limit={limit}`,
                        description: 'Relevance-scored content search. Returns top matching entries with excerpts.',
                        content_type: 'application/json',
                        parameters: {
                            query: { type: 'string', required: true, description: 'Search query' },
                            limit: { type: 'integer', required: false, default: 5, max: 20, description: 'Number of results' },
                            collection: { type: 'string', required: false, description: 'Filter by collection slug' },
                        },
                    },
                    page_content: {
                        url: `${siteUrl}/ai/{collection}/{slug}.md`,
                        description: 'Individual page content as markdown with YAML frontmatter.',
                        content_type: 'text/markdown',
                    },
                    structured_data: {
                        url: `${siteUrl}/ai/structured/{collection}/{slug}.json`,
                        description: 'JSON-LD structured data (Schema.org) for individual pages.',
                        content_type: 'application/json',
                    },
                },
                discovery: {
                    robots_txt_entry: `# AI Content\nSitemap: ${siteUrl}/ai/sitemap.json\n\nUser-agent: *\nAllow: /llms.txt\nAllow: /llms-full.txt\nAllow: /ai/`,
                    html_meta_tags: [
                        `<link rel="ai-content" href="${siteUrl}/llms.txt" type="text/markdown" title="AI Content Index">`,
                        `<link rel="ai-content-full" href="${siteUrl}/llms-full.txt" type="text/markdown" title="Full AI Content">`,
                    ],
                    sitemap_entries: [
                        `${siteUrl}/llms.txt`,
                        `${siteUrl}/llms-full.txt`,
                        `${siteUrl}/ai/sitemap.json`,
                    ],
                },
                contact: siteUrl,
                logo_url: `${siteUrl}/favicon.ico`,
            };
            return Response.json(manifest, {
                status: 200,
                headers: {
                    'Cache-Control': 'public, max-age=3600',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        },
    };
}
//# sourceMappingURL=well-known.js.map