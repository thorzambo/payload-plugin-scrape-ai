/**
 * Simple in-memory sliding window rate limiter per IP.
 */
export class RateLimiter {
    constructor(maxPerMinute) {
        this.requests = new Map();
        this.maxPerMinute = maxPerMinute;
        this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
        this.cleanupTimer.unref();
    }
    destroy() {
        clearInterval(this.cleanupTimer);
        this.requests.clear();
    }
    check(ip) {
        const now = Date.now();
        const windowStart = now - 60000;
        let timestamps = this.requests.get(ip);
        if (!timestamps) {
            timestamps = [];
            this.requests.set(ip, timestamps);
        }
        const valid = timestamps.filter((t) => t > windowStart);
        this.requests.set(ip, valid);
        if (valid.length >= this.maxPerMinute) {
            return false;
        }
        valid.push(now);
        return true;
    }
    cleanup() {
        const now = Date.now();
        const windowStart = now - 60000;
        for (const [ip, timestamps] of this.requests.entries()) {
            const valid = timestamps.filter((t) => t > windowStart);
            if (valid.length === 0) {
                this.requests.delete(ip);
            }
            else {
                this.requests.set(ip, valid);
            }
        }
    }
}
/**
 * Extract client IP from request, respecting X-Forwarded-For.
 */
export function getClientIp(req) {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return 'unknown';
}
export function rateLimitedResponse() {
    return new Response('Too Many Requests', {
        status: 429,
        headers: { 'Content-Type': 'text/plain', 'Retry-After': '60' },
    });
}
//# sourceMappingURL=rate-limiter.js.map