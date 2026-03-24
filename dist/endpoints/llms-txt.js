"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLlmsTxtEndpoint = createLlmsTxtEndpoint;
const rate_limiter_1 = require("./rate-limiter");
function createLlmsTxtEndpoint(rateLimiter) {
    return {
        path: '/llms.txt',
        method: 'get',
        handler: async (req) => {
            if (!rateLimiter.check((0, rate_limiter_1.getClientIp)(req))) {
                return (0, rate_limiter_1.rateLimitedResponse)();
            }
            const { payload } = req;
            const locale = new URL(req.url || '', 'http://localhost').searchParams.get('locale');
            try {
                const result = await payload.find({
                    collection: 'ai-content',
                    where: {
                        sourceCollection: { equals: '__aggregate' },
                        sourceDocId: { equals: '__llms-txt' },
                    },
                    limit: 1,
                });
                if (result.docs.length === 0) {
                    return new Response('# No content generated yet\n\n> Run initial sync to generate content.', {
                        status: 200,
                        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
                    });
                }
                const content = result.docs[0].markdown || '';
                const lastSynced = result.docs[0].lastSynced || '';
                return new Response(content, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/markdown; charset=utf-8',
                        'Cache-Control': 'public, max-age=60',
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
//# sourceMappingURL=llms-txt.js.map