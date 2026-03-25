/**
 * Simple in-memory sliding window rate limiter per IP.
 */
export declare class RateLimiter {
    private requests;
    private maxPerMinute;
    private cleanupTimer;
    constructor(maxPerMinute: number);
    destroy(): void;
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