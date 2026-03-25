import type { PayloadRequest } from 'payload';
import { RateLimiter } from './rate-limiter';
export declare function createSitemapJsonEndpoint(rateLimiter: RateLimiter): {
    path: string;
    method: "get";
    handler: (req: PayloadRequest) => Promise<Response>;
};
//# sourceMappingURL=sitemap-json.d.ts.map