/**
 * Creates a HEAD handler that mirrors a GET handler's response headers.
 *
 * WHY: ChatGPT, Perplexity, and many HTTP clients send HEAD first.
 * Without HEAD support, Payload returns 404 and the client gives up.
 */
export function withHeadSupport(endpointConfig) {
    return [
        endpointConfig,
        {
            path: endpointConfig.path,
            method: 'head',
            handler: async (req) => {
                try {
                    const originalResponse = await endpointConfig.handler(req);
                    const headers = {};
                    originalResponse.headers.forEach((value, key) => {
                        headers[key] = value;
                    });
                    return new Response(null, {
                        status: originalResponse.status,
                        headers,
                    });
                }
                catch {
                    return new Response(null, { status: 200 });
                }
            },
        },
    ];
}
//# sourceMappingURL=head-support.js.map