"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLlmsFullTxtEndpoint = createLlmsFullTxtEndpoint;
const rate_limiter_1 = require("./rate-limiter");
function createLlmsFullTxtEndpoint(rateLimiter) {
    return {
        path: '/llms-full.txt',
        method: 'get',
        handler: async (req) => {
            if (!rateLimiter.check((0, rate_limiter_1.getClientIp)(req))) {
                return (0, rate_limiter_1.rateLimitedResponse)();
            }
            const { payload } = req;
            try {
                const result = await payload.find({
                    collection: 'ai-content',
                    where: {
                        sourceCollection: { equals: '__aggregate' },
                        sourceDocId: { equals: '__llms-full-txt' },
                    },
                    limit: 1,
                });
                if (result.docs.length === 0) {
                    return new Response('# No content generated yet', {
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
//# sourceMappingURL=llms-full-txt.js.map