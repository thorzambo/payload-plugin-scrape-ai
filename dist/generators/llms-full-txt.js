async function fetchAllContent(payload, where, sort) {
    const allDocs = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
        const result = await payload.find({
            collection: 'ai-content',
            where,
            limit: 500,
            page,
            sort: sort || 'title',
        });
        allDocs.push(...result.docs);
        hasMore = result.hasNextPage;
        page++;
    }
    return allDocs;
}
/**
 * Generate comprehensive llms-full.txt with ALL synced entries.
 * Includes inline content excerpts so agents can get meaningful
 * content in a single request without hopping to each .md file.
 */
export async function generateLlmsFullTxt(params) {
    const { payload, siteUrl, siteName, siteDescription } = params;
    const entries = await fetchAllContent(payload, {
        sourceCollection: { not_equals: '__aggregate' },
        status: { equals: 'synced' },
        isDraft: { equals: false },
    }, 'sourceCollection');
    // Group by collection
    const grouped = {};
    for (const entry of entries) {
        const collection = entry.sourceCollection;
        const slug = entry.slug;
        const title = entry.title;
        const markdown = entry.markdown || '';
        const aiMeta = entry.aiMeta;
        const isDraft = Boolean(entry.isDraft);
        if (!grouped[collection])
            grouped[collection] = [];
        // Extract clean excerpt: strip frontmatter, take first 500 chars
        const cleanContent = markdown.replace(/^---[\s\S]*?---\n*/m, '').trim();
        const excerpt = cleanContent.slice(0, 500).trim();
        grouped[collection].push({
            title,
            url: `${siteUrl}/ai/${collection}/${slug}.md`,
            description: aiMeta?.summary || title,
            excerpt,
            isDraft,
            topics: aiMeta?.topics || [],
        });
    }
    // Build output
    const lines = [];
    lines.push(`# ${siteName}`);
    lines.push('');
    if (siteDescription) {
        lines.push(`> ${siteDescription}`);
        lines.push('');
    }
    lines.push(`> Comprehensive listing of all ${entries.length} content entries with inline excerpts.`);
    lines.push(`> For a curated overview, see [/llms.txt](${siteUrl}/llms.txt).`);
    lines.push(`> For structured data, see [/ai/sitemap.json](${siteUrl}/ai/sitemap.json).`);
    lines.push('');
    for (const [collection, items] of Object.entries(grouped)) {
        const label = collection.charAt(0).toUpperCase() + collection.slice(1);
        lines.push(`## ${label}`);
        lines.push('');
        for (const item of items) {
            const draftTag = item.isDraft ? ' [DRAFT]' : '';
            const topicsStr = item.topics.length > 0 ? ` | Topics: ${item.topics.join(', ')}` : '';
            lines.push(`### [${item.title}](${item.url})${draftTag}`);
            if (item.description !== item.title) {
                lines.push(`> ${item.description}${topicsStr}`);
            }
            lines.push('');
            if (item.excerpt) {
                lines.push(item.excerpt);
                if (item.excerpt.length >= 500) {
                    lines.push(`\n[... read full content](${item.url})`);
                }
            }
            lines.push('');
        }
    }
    return lines.join('\n').trim();
}
//# sourceMappingURL=llms-full-txt.js.map