import { generateJsonLd } from '../generators/json-ld';
/**
 * Stage 2: Add frontmatter, hierarchy, relationships, and JSON-LD to extracted markdown.
 */
export function structureContent(params) {
    const { markdown, doc, collectionSlug, collectionConfig, siteUrl, siteName, locale, allContent } = params;
    // Extract title
    const title = extractTitle(doc);
    // Extract slug
    const originalSlug = extractSlug(doc);
    const urlSlug = toUrlSlug(originalSlug);
    // Determine draft status
    const isDraft = doc._status === 'draft';
    // Detect parent from slug pattern
    const parentSlug = inferParent(originalSlug);
    // Find children if allContent provided
    const children = allContent
        ? allContent
            .filter((c) => c.sourceCollection === collectionSlug &&
            c.slug !== urlSlug &&
            c.parentSlug === urlSlug)
            .map((c) => c.slug)
        : [];
    // Extract related slugs from relationship fields
    const relatedSlugs = extractRelatedSlugs(doc, collectionConfig);
    // Generate JSON-LD
    const lastModified = (doc.updatedAt || doc.createdAt || new Date().toISOString());
    const description = extractDescription(doc);
    const jsonLd = generateJsonLd({
        title,
        slug: originalSlug,
        collection: collectionSlug,
        siteUrl,
        siteName,
        description,
        lastModified,
        createdAt: (doc.createdAt || new Date().toISOString()),
    });
    // Build frontmatter
    const canonicalUrl = `${siteUrl}/${originalSlug}`.slice(0, 2048);
    const frontmatter = {
        title,
        slug: originalSlug,
        collection: collectionSlug,
        canonicalUrl,
        lastModified,
        contentType: jsonLd['@type'] || 'CreativeWork',
    };
    if (parentSlug)
        frontmatter.parent = parentSlug;
    frontmatter.children = children;
    if (locale)
        frontmatter.locale = locale;
    if (isDraft)
        frontmatter.draft = true;
    // Build the full markdown with frontmatter
    const frontmatterYaml = buildFrontmatter(frontmatter);
    // Build related content section
    const relatedSection = buildRelatedSection(relatedSlugs, collectionSlug, siteUrl);
    const fullMarkdown = [
        frontmatterYaml,
        `# ${title}`,
        markdown,
        relatedSection,
    ]
        .filter(Boolean)
        .join('\n\n');
    return {
        markdown: fullMarkdown,
        title,
        slug: urlSlug,
        urlSlug,
        canonicalUrl: `${siteUrl}/${originalSlug}`.slice(0, 2048),
        parentSlug: parentSlug ? toUrlSlug(parentSlug) : undefined,
        relatedSlugs,
        jsonLd,
        isDraft,
        locale,
    };
}
// --- Helpers ---
function extractTitle(doc) {
    for (const key of ['title', 'name', 'label', 'heading']) {
        if (typeof doc[key] === 'string' && doc[key]) {
            return doc[key];
        }
    }
    return String(doc.id || 'Untitled');
}
function extractSlug(doc) {
    for (const key of ['slug', 'path', 'uri']) {
        if (typeof doc[key] === 'string' && doc[key]) {
            return doc[key].replace(/^\//, ''); // strip leading slash
        }
    }
    return String(doc.id || 'unknown');
}
function extractDescription(doc) {
    for (const key of ['description', 'excerpt', 'summary']) {
        if (typeof doc[key] === 'string' && doc[key])
            return doc[key];
    }
    const meta = doc.meta;
    if (meta && typeof meta.description === 'string' && meta.description) {
        return meta.description;
    }
    return undefined;
}
export function toUrlSlug(slug) {
    return slug.replace(/\//g, '-');
}
export function inferParent(slug) {
    const parts = slug.split('/');
    if (parts.length <= 1)
        return undefined;
    return parts.slice(0, -1).join('/');
}
function extractRelatedSlugs(doc, collectionConfig) {
    const related = [];
    for (const field of collectionConfig.fields || []) {
        if (!('name' in field) || !('type' in field))
            continue;
        const fieldType = field.type;
        if (fieldType === 'relationship' || fieldType === 'upload') {
            const value = doc[field.name];
            if (!value)
                continue;
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (typeof item === 'object' && item !== null) {
                        const slug = item.slug || item.path;
                        if (slug)
                            related.push(toUrlSlug(slug));
                    }
                }
            }
            else if (typeof value === 'object') {
                const slug = value.slug || value.path;
                if (slug)
                    related.push(toUrlSlug(slug));
            }
        }
    }
    return related;
}
function buildFrontmatter(data) {
    const lines = ['---'];
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === null)
            continue;
        if (Array.isArray(value)) {
            if (value.length === 0) {
                lines.push(`${key}: []`);
            }
            else {
                lines.push(`${key}:`);
                for (const item of value) {
                    lines.push(`  - "${escapeYamlString(String(item))}"`);
                }
            }
        }
        else if (typeof value === 'boolean') {
            lines.push(`${key}: ${value}`);
        }
        else {
            lines.push(`${key}: "${escapeYamlString(String(value))}"`);
        }
    }
    lines.push('---');
    return lines.join('\n');
}
function escapeYamlString(str) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}
function buildRelatedSection(relatedSlugs, collectionSlug, siteUrl) {
    if (relatedSlugs.length === 0)
        return '';
    const links = relatedSlugs
        .map((slug) => `- [${slug}](${siteUrl}/ai/${collectionSlug}/${slug}.md)`)
        .join('\n');
    return `## Related Content\n${links}`;
}
//# sourceMappingURL=structure.js.map