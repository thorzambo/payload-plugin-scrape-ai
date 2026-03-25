/**
 * AI Content collection — stores generated content mirrors.
 *
 * Production: create compound index on (sourceCollection, sourceDocId)
 * for optimal query performance:
 *   db['ai-content'].createIndex({ sourceCollection: 1, sourceDocId: 1 })
 *
 * For very large sites (>1MB markdown per doc), consider external storage.
 * MongoDB's 16MB document limit applies to the full document.
 */ export function createAiContentCollection(overrides) {
    const defaultFields = [
        {
            name: 'sourceCollection',
            type: 'text',
            required: true,
            index: true
        },
        {
            name: 'sourceDocId',
            type: 'text',
            required: true,
            index: true
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            index: true
        },
        {
            name: 'title',
            type: 'text',
            required: true
        },
        {
            name: 'canonicalUrl',
            type: 'text',
            maxLength: 2048
        },
        {
            name: 'markdown',
            type: 'textarea'
        },
        {
            name: 'jsonLd',
            type: 'json'
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            index: true,
            defaultValue: 'pending',
            options: [
                {
                    label: 'Pending',
                    value: 'pending'
                },
                {
                    label: 'Processing',
                    value: 'processing'
                },
                {
                    label: 'Synced',
                    value: 'synced'
                },
                {
                    label: 'Error',
                    value: 'error'
                },
                {
                    label: 'Error (Permanent)',
                    value: 'error-permanent'
                }
            ]
        },
        {
            name: 'errorMessage',
            type: 'text'
        },
        {
            name: 'retryCount',
            type: 'number',
            defaultValue: 0
        },
        {
            name: 'aiMeta',
            type: 'json'
        },
        {
            name: 'parentSlug',
            type: 'text'
        },
        {
            name: 'relatedSlugs',
            type: 'json'
        },
        {
            name: 'locale',
            type: 'text',
            index: true
        },
        {
            name: 'isDraft',
            type: 'checkbox',
            defaultValue: false,
            index: true
        },
        {
            name: 'lastSynced',
            type: 'date'
        }
    ];
    return {
        slug: 'ai-content',
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

//# sourceMappingURL=ai-content.js.map