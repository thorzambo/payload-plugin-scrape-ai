import type { PayloadRequest } from 'payload';
import { RateLimiter } from './rate-limiter';
export declare function createLlmsTxtEndpoint(rateLimiter: RateLimiter): {
    path: string;
    method: "get";
    handler: (req: PayloadRequest) => Promise<Response>;
};
//# sourceMappingURL=llms-txt.d.ts.map