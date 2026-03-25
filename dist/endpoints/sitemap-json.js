import { getClientIp, rateLimitedResponse } from './rate-limiter';
export function createSitemapJsonEndpoint(rateLimiter) {
    return {
        path: '/ai/sitemap.json',
        method: 'get',
        handler: async (req) => {
            if (!rateLimiter.check(getClientIp(req))) {
                return rateLimitedResponse();
            }
            const { payload } = req;
            try {
                const result = await payload.find({
                    collection: 'ai-content',
                    where: {
                        sourceCollection: { equals: '__aggregate' },
                        sourceDocId: { equals: '__sitemap-json' },
                    },
                    limit: 1,
                });
                if (result.docs.length === 0) {
                    return Response.json({ error: 'No sitemap generated yet' }, { status: 200 });
                }
                const content = result.docs[0].markdown || '{}';
                const lastSynced = result.docs[0].lastSynced || '';
                // The sitemap is stored as JSON string in the markdown field
                let parsed;
                try {
                    parsed = JSON.parse(content);
                }
                catch {
                    parsed = { error: 'Invalid sitemap data' };
                }
                return Response.json(parsed, {
                    status: 200,
                    headers: {
                        'Cache-Control': 'public, max-age=60',
                        ...(lastSynced ? { ETag: `"${new Date(lastSynced).getTime()}"` } : {}),
                    },
                });
            }
            catch (error) {
                return Response.json({ error: error.message }, { status: 500 });
            }
        },
    };
}
//# sourceMappingURL=sitemap-json.js.map