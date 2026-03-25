/**
 * Creates a HEAD handler that returns standard headers without executing the full GET handler.
 *
 * WHY: ChatGPT, Perplexity, and many HTTP clients send HEAD first.
 * Without HEAD support, Payload returns 404 and the client gives up.
 * We return static headers to avoid executing full DB queries for HEAD requests.
 */
export function withHeadSupport(endpointConfig) {
    return [
        endpointConfig,
        {
            path: endpointConfig.path,
            method: 'head',
            handler: async (req) => {
                return new Response(null, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                        'Cache-Control': 'public, max-age=60',
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            },
        },
    ];
}
//# sourceMappingURL=head-support.js.map