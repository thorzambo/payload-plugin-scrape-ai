/**
 * Generate JSON-LD structured data for a document.
 * Maps collection slugs to schema.org types.
 */
export function generateJsonLd(params) {
    const { title, slug, collection, siteUrl, siteName, description, lastModified, createdAt } = params;
    const schemaType = inferSchemaType(collection, params.contentType);
    const canonicalUrl = `${siteUrl}/${slug}`;
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': schemaType,
        name: title,
        url: canonicalUrl,
        '@id': canonicalUrl,
        isPartOf: {
            '@type': 'WebSite',
            name: siteName,
            url: siteUrl,
        },
    };
    if (description) {
        jsonLd.description = description;
    }
    if (lastModified) {
        jsonLd.dateModified = lastModified;
    }
    // Add type-specific properties
    switch (schemaType) {
        case 'Article':
        case 'BlogPosting':
            jsonLd.datePublished = createdAt || lastModified;
            jsonLd.headline = title;
            break;
        case 'Product':
            // Products might have price, but we can't know the field structure
            // So we keep it generic
            break;
    }
    return jsonLd;
}
/**
 * Map collection slug to schema.org type.
 */
function inferSchemaType(collection, explicitType) {
    if (explicitType)
        return explicitType;
    const slug = collection.toLowerCase();
    // Direct mappings
    const typeMap = {
        pages: 'WebPage',
        page: 'WebPage',
        posts: 'Article',
        post: 'Article',
        articles: 'Article',
        article: 'Article',
        blog: 'BlogPosting',
        'blog-posts': 'BlogPosting',
        products: 'Product',
        product: 'Product',
        services: 'Service',
        service: 'Service',
        events: 'Event',
        event: 'Event',
        team: 'Person',
        members: 'Person',
        faq: 'FAQPage',
        faqs: 'FAQPage',
        reviews: 'Review',
        review: 'Review',
        projects: 'CreativeWork',
        project: 'CreativeWork',
        portfolio: 'CreativeWork',
        categories: 'Thing',
        category: 'Thing',
        tags: 'Thing',
        tag: 'Thing',
    };
    return typeMap[slug] || 'CreativeWork';
}
//# sourceMappingURL=json-ld.js.map