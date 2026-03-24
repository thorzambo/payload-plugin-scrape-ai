import type { PayloadRequest } from 'payload';
import { RateLimiter } from './rate-limiter';
export declare function createLlmsFullTxtEndpoint(rateLimiter: RateLimiter): {
    path: string;
    method: "get";
    handler: (req: PayloadRequest) => Promise<Response>;
};
//# sourceMappingURL=llms-full-txt.d.ts.map