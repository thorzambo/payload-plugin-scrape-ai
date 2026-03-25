import { getClientIp, rateLimitedResponse } from './rate-limiter';
export function createContentMarkdownEndpoint(rateLimiter) {
    return {
        path: '/ai/:collection/:slug',
        method: 'get',
        handler: async (req) => {
            if (!rateLimiter.check(getClientIp(req))) {
                return rateLimitedResponse();
            }
            const { payload } = req;
            const params = req.routeParams || {};
            const collection = params.collection;
            let slug = params.slug;
            // Strip .md extension if present
            if (slug?.endsWith('.md')) {
                slug = slug.slice(0, -3);
            }
            if (!collection || !slug) {
                return new Response('Not Found', { status: 404 });
            }
            const url = new URL(req.url || '', 'http://localhost');
            const locale = url.searchParams.get('locale');
            try {
                const whereClause = {
                    sourceCollection: { equals: collection },
                    slug: { equals: slug },
                };
                if (locale) {
                    whereClause.locale = { equals: locale };
                }
                const result = await payload.find({
                    collection: 'ai-content',
                    where: whereClause,
                    limit: 1,
                });
                if (result.docs.length === 0) {
                    return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
                }
                const content = result.docs[0].markdown || '';
                const lastSynced = result.docs[0].lastSynced || '';
                return new Response(content, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                        'Cache-Control': 'public, max-age=60, s-maxage=300',
                        ...(lastSynced ? { ETag: `"${new Date(lastSynced).getTime()}"` } : {}),
                    },
                });
            }
            catch (error) {
                return new Response(`Error: ${error.message}`, { status: 500 });
            }
        },
    };
}
//# sourceMappingURL=content-markdown.js.map