import type { Endpoint } from 'payload';
/**
 * Creates a HEAD handler that mirrors a GET handler's response headers.
 *
 * WHY: ChatGPT, Perplexity, and many HTTP clients send HEAD first.
 * Without HEAD support, Payload returns 404 and the client gives up.
 */
export declare function withHeadSupport(endpointConfig: Endpoint): Endpoint[];
//# sourceMappingURL=head-support.d.ts.map