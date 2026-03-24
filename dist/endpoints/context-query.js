"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContextQueryEndpoint = createContextQueryEndpoint;
const rate_limiter_1 = require("./rate-limiter");
function createContextQueryEndpoint(rateLimiter, siteUrl) {
    return {
        path: '/ai/context',
        method: 'get',
        handler: async (req) => {
            if (!rateLimiter.check((0, rate_limiter_1.getClientIp)(req))) {
                return (0, rate_limiter_1.rateLimitedResponse)();
            }
            const { payload } = req;
            const url = new URL(req.url || '', 'http://localhost');
            const query = url.searchParams.get('query');
            const limitParam = url.searchParams.get('limit');
            const collectionFilter = url.searchParams.get('collection');
            if (!query) {
                return Response.json({ error: 'query parameter is required' }, { status: 400 });
            }
            const limit = Math.min(Math.max(parseInt(limitParam || '5', 10) || 5, 1), 20);
            try {
                // Query all synced non-aggregate entries
                const whereClause = {
                    sourceCollection: { not_equals: '__aggregate' },
                    status: { equals: 'synced' },
                };
                if (collectionFilter) {
                    whereClause.sourceCollection = { equals: collectionFilter };
                }
                const allContent = await payload.find({
                    collection: 'ai-content',
                    where: whereClause,
                    limit: 1000,
                    // Only fetch fields needed for scoring — avoid loading full markdown
                });
                // Score and rank entries
                const terms = tokenize(query);
                const scored = [];
                for (const entry of allContent.docs) {
                    const title = entry.title || '';
                    const slug = entry.slug || '';
                    const markdown = entry.markdown || '';
                    const collection = entry.sourceCollection || '';
                    const aiMeta = entry.aiMeta;
                    const topics = aiMeta?.topics || [];
                    const entities = aiMeta?.entities || [];
                    const summary = aiMeta?.summary || '';
                    let score = 0;
                    for (const term of terms) {
                        const termLower = term.toLowerCase();
                        // Title matches (3x weight)
                        if (title.toLowerCase().includes(termLower)) {
                            score += 3;
                        }
                        // Slug matches (2x weight)
                        if (slug.toLowerCase().includes(termLower)) {
                            score += 2;
                        }
                        // Summary or title-based body matches (1x weight)
                        // We avoid scoring against full markdown to reduce memory pressure
                        if (summary.toLowerCase().includes(termLower)) {
                            score += 1;
                        }
                        // Topic matches (4x weight)
                        for (const topic of topics) {
                            if (topic.toLowerCase().includes(termLower)) {
                                score += 4;
                            }
                        }
                        // Entity matches (3x weight)
                        for (const entity of entities) {
                            if (entity.toLowerCase().includes(termLower)) {
                                score += 3;
                            }
                        }
                        // Summary matches (2x weight)
                        if (summary.toLowerCase().includes(termLower)) {
                            score += 2;
                        }
                    }
                    if (score > 0) {
                        // Normalize score to 0-1 range (rough approximation)
                        const maxPossibleScore = terms.length * (3 + 2 + 1 + 4 + 3 + 2); // 15 per term max
                        const normalizedScore = Math.min(score / maxPossibleScore, 1);
                        scored.push({
                            title,
                            slug,
                            collection,
                            url: `/ai/${collection}/${slug}.md`,
                            canonicalUrl: entry.canonicalUrl || `${siteUrl}/${slug}`,
                            excerpt: (summary || title).slice(0, 200).trim(),
                            summary: summary || undefined,
                            topics: topics.length > 0 ? topics : undefined,
                            relevanceScore: Math.round(normalizedScore * 100) / 100,
                            score,
                        });
                    }
                }
                // Sort by score descending, take top N
                scored.sort((a, b) => b.score - a.score);
                const topResults = scored.slice(0, limit);
                // Remove internal score field
                const results = topResults.map(({ score, ...rest }) => rest);
                const response = {
                    query,
                    results,
                    totalResults: results.length,
                };
                return Response.json(response, {
                    status: 200,
                    headers: { 'Cache-Control': 'public, max-age=30' },
                });
            }
            catch (error) {
                return Response.json({ error: error.message }, { status: 500 });
            }
        },
    };
}
function tokenize(query) {
    return query
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 1);
}
//# sourceMappingURL=context-query.js.map