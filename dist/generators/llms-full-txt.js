/**
 * Generate comprehensive llms-full.txt with ALL synced entries.
 */
export async function generateLlmsFullTxt(params) {
    const { payload, siteUrl, siteName, siteDescription } = params;
    // Query ALL synced non-aggregate entries (including drafts if in include-drafts mode)
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
    const grouped = {};
    for (const entry of entries) {
        const collection = entry.sourceCollection;
        const slug = entry.slug;
        const title = entry.title;
        const aiMeta = entry.aiMeta;
        const isDraft = Boolean(entry.isDraft);
        if (!grouped[collection])
            grouped[collection] = [];
        grouped[collection].push({
            title,
            url: `${siteUrl}/ai/${collection}/${slug}.md`,
            description: aiMeta?.summary || title,
            isDraft,
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
    lines.push(`> This is the comprehensive listing of all content. See /llms.txt for a curated overview.`);
    lines.push('');
    for (const [collection, items] of Object.entries(grouped)) {
        const label = collection.charAt(0).toUpperCase() + collection.slice(1);
        lines.push(`## ${label}`);
        for (const item of items) {
            const draftTag = item.isDraft ? ' [DRAFT]' : '';
            lines.push(`- [${item.title}](${item.url}): ${item.description}${draftTag}`);
        }
        lines.push('');
    }
    return lines.join('\n').trim();
}
//# sourceMappingURL=llms-full-txt.js.map