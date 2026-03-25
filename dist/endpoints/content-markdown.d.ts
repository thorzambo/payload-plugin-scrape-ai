import type { PayloadRequest } from 'payload';
import { RateLimiter } from './rate-limiter';
export declare function createContentMarkdownEndpoint(rateLimiter: RateLimiter): {
    path: string;
    method: "get";
    handler: (req: PayloadRequest) => Promise<Response>;
};
//# sourceMappingURL=content-markdown.d.ts.map