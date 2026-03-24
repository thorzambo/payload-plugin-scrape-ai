/**
 * Simple in-memory sliding window rate limiter per IP.
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private maxPerMinute: number

  constructor(maxPerMinute: number) {
    this.maxPerMinute = maxPerMinute

    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Check if a request from the given IP is allowed.
   */
  check(ip: string): boolean {
    const now = Date.now()
    const windowStart = now - 60000 // 1 minute window

    let timestamps = this.requests.get(ip)
    if (!timestamps) {
      timestamps = []
      this.requests.set(ip, timestamps)
    }

    // Remove expired timestamps
    const valid = timestamps.filter((t) => t > windowStart)
    this.requests.set(ip, valid)

    if (valid.length >= this.maxPerMinute) {
      return false
    }

    valid.push(now)
    return true
  }

  private cleanup(): void {
    const now = Date.now()
    const windowStart = now - 60000

    for (const [ip, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter((t) => t > windowStart)
      if (valid.length === 0) {
        this.requests.delete(ip)
      } else {
        this.requests.set(ip, valid)
      }
    }
  }
}

/**
 * Extract client IP from request, respecting X-Forwarded-For.
 */
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return 'unknown'
}

export function rateLimitedResponse(): Response {
  return new Response('Too Many Requests', {
    status: 429,
    headers: { 'Content-Type': 'text/plain', 'Retry-After': '60' },
  })
}
