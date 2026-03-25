import type { Endpoint } from 'payload';
/**
 * Creates a HEAD handler that returns standard headers without executing the full GET handler.
 *
 * WHY: ChatGPT, Perplexity, and many HTTP clients send HEAD first.
 * Without HEAD support, Payload returns 404 and the client gives up.
 * We return static headers to avoid executing full DB queries for HEAD requests.
 */
export declare function withHeadSupport(endpointConfig: Endpoint): Endpoint[];
//# sourceMappingURL=head-support.d.ts.map