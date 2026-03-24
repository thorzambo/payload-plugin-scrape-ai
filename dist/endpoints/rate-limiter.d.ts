/**
 * Simple in-memory sliding window rate limiter per IP.
 */
export declare class RateLimiter {
    private requests;
    private maxPerMinute;
    constructor(maxPerMinute: number);
    /**
     * Check if a request from the given IP is allowed.
     */
    check(ip: string): boolean;
    private cleanup;
}
/**
 * Extract client IP from request, respecting X-Forwarded-For.
 */
export declare function getClientIp(req: {
    headers: {
        get(name: string): string | null;
    };
}): string;
export declare function rateLimitedResponse(): Response;
//# sourceMappingURL=rate-limiter.d.ts.map