const cache = new Map();
const DEFAULT_TTL_MS = 60000; // 60 seconds
export function getCached(key) {
    const entry = cache.get(key);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.content;
}
export function setCache(key, content, ttlMs = DEFAULT_TTL_MS) {
    cache.set(key, { content, expiresAt: Date.now() + ttlMs });
}
export function invalidateCache(key) {
    if (key) {
        cache.delete(key);
    }
    else {
        cache.clear();
    }
}
//# sourceMappingURL=aggregate-cache.js.map