/**
 * AI Aggregates — stores pre-generated aggregate content (llms.txt, sitemap, etc.)
 * Separated from ai-content to avoid polluting document queries.
 */ export function createAiAggregatesCollection(overrides) {
    const defaultFields = [
        {
            name: 'key',
            type: 'text',
            required: true,
            unique: true,
            index: true
        },
        {
            name: 'content',
            type: 'textarea'
        },
        {
            name: 'lastGenerated',
            type: 'date'
        }
    ];
    return {
        slug: 'ai-aggregates',
        admin: {
            hidden: true,
            ...overrides?.admin || {}
        },
        access: {
            read: ()=>true,
            create: ({ req })=>Boolean(req.user),
            update: ({ req })=>Boolean(req.user),
            delete: ({ req })=>Boolean(req.user),
            ...overrides?.access || {}
        },
        hooks: {
            ...overrides?.hooks || {}
        },
        fields: overrides?.fields ? overrides.fields({
            defaultFields
        }) : defaultFields
    };
}

//# sourceMappingURL=ai-aggregates.js.map