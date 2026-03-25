import type { PayloadRequest } from 'payload';
import { RateLimiter } from './rate-limiter';
export declare function createContextQueryEndpoint(rateLimiter: RateLimiter, siteUrl: string): {
    path: string;
    method: "get";
    handler: (req: PayloadRequest) => Promise<Response>;
};
//# sourceMappingURL=context-query.d.ts.map