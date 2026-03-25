import type { PayloadRequest } from 'payload';
import { RateLimiter } from './rate-limiter';
export declare function createStructuredDataEndpoint(rateLimiter: RateLimiter): {
    path: string;
    method: "get";
    handler: (req: PayloadRequest) => Promise<Response>;
};
//# sourceMappingURL=structured-data.d.ts.map