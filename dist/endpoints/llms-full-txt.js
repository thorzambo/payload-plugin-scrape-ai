import { getClientIp, rateLimitedResponse } from './rate-limiter';
import { getCached, setCache } from '../cache/aggregate-cache';
export function createLlmsFullTxtEndpoint(rateLimiter) {
    return {
        path: '/llms-full.txt',
        method: 'get',
        handler: async (req)=>{
            if (!rateLimiter.check(getClientIp(req))) {
                return rateLimitedResponse();
            }
            const cached = getCached('llms-full-txt');
            if (cached) {
                return new Response(cached, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                        'Cache-Control': 'public, max-age=300, s-maxage=600'
                    }
                });
            }
            const { payload } = req;
            try {
                const result = await payload.find({
                    collection: 'ai-aggregates',
                    where: {
                        key: {
                            equals: '__llms-full-txt'
                        }
                    },
                    limit: 1
                });
                if (result.docs.length === 0) {
                    return new Response('# No content generated yet', {
                        status: 200,
                        headers: {
                            'Content-Type': 'text/markdown; charset=utf-8'
                        }
                    });
                }
                const content = result.docs[0].content || '';
                const lastGenerated = result.docs[0].lastGenerated || '';
                setCache('llms-full-txt', content);
                return new Response(content, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                        'Cache-Control': 'public, max-age=300, s-maxage=600',
                        ...lastGenerated ? {
                            ETag: `"${new Date(lastGenerated).getTime()}"`
                        } : {}
                    }
                });
            } catch (error) {
                return new Response(`Error: ${error.message}`, {
                    status: 500
                });
            }
        }
    };
}

//# sourceMappingURL=llms-full-txt.js.map