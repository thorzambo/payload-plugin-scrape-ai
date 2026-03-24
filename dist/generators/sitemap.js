"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAiSitemap = generateAiSitemap;
/**
 * Generate the AI sitemap JSON with content relationships and hierarchy.
 */
async function generateAiSitemap(params) {
    const { payload, siteUrl, siteName } = params;
    const allContent = await payload.find({
        collection: 'ai-content',
        where: {
            sourceCollection: { not_equals: '__aggregate' },
            status: { equals: 'synced' },
        },
        limit: 10000,
        sort: 'sourceCollection',
    });
    const entries = allContent.docs;
    // Group by collection
    const collections = {};
    // Build hierarchy map
    const hierarchy = {};
    for (const entry of entries) {
        const collection = entry.sourceCollection;
        const slug = entry.slug;
        const title = entry.title;
        const parentSlug = entry.parentSlug;
        const relatedSlugs = (entry.relatedSlugs || []);
        const aiMeta = entry.aiMeta;
        const lastSynced = entry.lastSynced;
        const jsonLd = entry.jsonLd;
        if (!collections[collection]) {
            collections[collection] = { count: 0, entries: [] };
        }
        collections[collection].count++;
        collections[collection].entries.push({
            title,
            slug,
            url: `/ai/${collection}/${slug}.md`,
            canonicalUrl: entry.canonicalUrl || `${siteUrl}/${slug}`,
            parent: parentSlug || null,
            children: [], // populated below
            relatedTo: relatedSlugs,
            topics: aiMeta?.topics || [],
            lastModified: lastSynced,
            contentType: jsonLd?.['@type'] || 'CreativeWork',
        });
        // Build hierarchy
        if (parentSlug) {
            if (!hierarchy[parentSlug]) {
                hierarchy[parentSlug] = { children: [], url: `/ai/${collection}/${parentSlug}.md` };
            }
            hierarchy[parentSlug].children.push(slug);
        }
    }
    // Populate children in entries
    for (const [, collectionData] of Object.entries(collections)) {
        for (const entry of collectionData.entries) {
            const h = hierarchy[entry.slug];
            if (h) {
                entry.children = h.children;
            }
        }
    }
    return {
        siteName,
        siteUrl,
        generatedAt: new Date().toISOString(),
        totalEntries: entries.length,
        collections,
        hierarchy,
    };
}
//# sourceMappingURL=sitemap.js.map