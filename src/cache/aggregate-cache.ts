/**
 * Simple in-memory cache for aggregate content (llms.txt, sitemap, etc.)
 * Reduces DB queries on high-traffic public endpoints.
 */
interface CacheEntry {
  content: string
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const DEFAULT_TTL_MS = 60_000 // 60 seconds

export function getCached(key: string): string | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.content
}

export function setCache(key: string, content: string, ttlMs: number = DEFAULT_TTL_MS): void {
  cache.set(key, { content, expiresAt: Date.now() + ttlMs })
}

export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}
