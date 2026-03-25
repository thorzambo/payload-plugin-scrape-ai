async function fetchAllContent(payload, where, sort) {
    const allDocs = [];
    let page = 1;
    let hasMore = true;
    while(hasMore){
        const result = await payload.find({
            collection: 'ai-content',
            where,
            limit: 500,
            page,
            sort: sort || 'title'
        });
        allDocs.push(...result.docs);
        hasMore = result.hasNextPage;
        page++;
    }
    return allDocs;
}
/**
 * Generate the curated llms.txt content following the standard.
 */ export async function generateLlmsTxt(params) {
    const { payload, siteUrl, siteName, siteDescription } = params;
    // Load config for priority and sections
    let aiConfig = null;
    try {
        aiConfig = await payload.findGlobal({
            slug: 'ai-config'
        });
    } catch  {
    // Config may not exist yet
    }
    const priority = aiConfig?.llmsTxtPriority || [];
    const sections = aiConfig?.llmsTxtSections || [
        {
            name: 'pages',
            label: 'Pages'
        },
        {
            name: 'posts',
            label: 'Blog'
        }
    ];
    // Query all synced, non-draft entries
    const entries = await fetchAllContent(payload, {
        status: {
            equals: 'synced'
        },
        isDraft: {
            equals: false
        }
    }, 'title');
    // Build priority set for quick lookup
    const priorityMap = new Map();
    for (const p of priority){
        priorityMap.set(p.slug, {
            section: p.section,
            optional: p.optional
        });
    }
    // Organize entries into sections
    const sectionEntries = {};
    // Initialize sections
    for (const section of sections){
        sectionEntries[section.name] = [];
    }
    sectionEntries['optional'] = [];
    for (const entry of entries){
        const slug = entry.slug;
        const title = entry.title;
        const collection = entry.sourceCollection;
        const aiMeta = entry.aiMeta;
        const url = `${siteUrl}/ai/${collection}/${slug}.md`;
        const description = aiMeta?.summary || title;
        // Check if this entry has explicit priority config
        const priorityInfo = priorityMap.get(slug);
        if (priorityInfo) {
            if (priorityInfo.optional) {
                sectionEntries['optional'].push({
                    title,
                    url,
                    description,
                    optional: true
                });
            } else {
                const section = priorityInfo.section || collection;
                if (!sectionEntries[section]) sectionEntries[section] = [];
                sectionEntries[section].push({
                    title,
                    url,
                    description,
                    optional: false
                });
            }
        } else {
            // Auto-assign to collection-based section
            const sectionName = sections.find((s)=>s.name === collection)?.name || collection;
            if (!sectionEntries[sectionName]) sectionEntries[sectionName] = [];
            sectionEntries[sectionName].push({
                title,
                url,
                description,
                optional: false
            });
        }
    }
    // Build the llms.txt output
    const lines = [];
    lines.push(`# ${siteName}`);
    lines.push('');
    if (siteDescription) {
        lines.push(`> ${siteDescription}`);
        lines.push('');
    }
    // Discovery section — helps AI agents navigate
    lines.push(`## Navigation`);
    lines.push(`- [Full Content Index](${siteUrl}/llms-full.txt): Complete listing of all ${entries.length} pages`);
    lines.push(`- [Content Sitemap](${siteUrl}/ai/sitemap.json): Structured content graph with relationships`);
    lines.push(`- [Search Content](${siteUrl}/ai/context?query=): Query content by relevance`);
    lines.push(`- [Discovery Manifest](${siteUrl}/.well-known/ai-plugin.json): Machine-readable endpoint catalog`);
    lines.push('');
    // Regular sections
    for (const section of sections){
        const items = sectionEntries[section.name];
        if (!items || items.length === 0) continue;
        lines.push(`## ${section.label}`);
        for (const item of items){
            lines.push(`- [${item.title}](${item.url}): ${item.description}`);
        }
        lines.push('');
    }
    // Any extra sections not in the predefined list
    for (const [name, items] of Object.entries(sectionEntries)){
        if (name === 'optional') continue;
        if (sections.find((s)=>s.name === name)) continue;
        if (items.length === 0) continue;
        const label = name.charAt(0).toUpperCase() + name.slice(1);
        lines.push(`## ${label}`);
        for (const item of items){
            lines.push(`- [${item.title}](${item.url}): ${item.description}`);
        }
        lines.push('');
    }
    // Optional section
    const optionalItems = sectionEntries['optional'];
    if (optionalItems && optionalItems.length > 0) {
        lines.push(`## Optional`);
        for (const item of optionalItems){
            lines.push(`- [${item.title}](${item.url}): ${item.description}`);
        }
        lines.push('');
    }
    return lines.join('\n').trim();
}

//# sourceMappingURL=llms-txt.js.map