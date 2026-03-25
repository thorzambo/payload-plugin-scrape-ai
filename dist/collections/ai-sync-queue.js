export const aiSyncQueueCollection = {
    slug: 'ai-sync-queue',
    admin: {
        hidden: true,
    },
    access: {
        read: ({ req }) => Boolean(req.user),
        create: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
        delete: ({ req }) => Boolean(req.user),
    },
    fields: [
        {
            name: 'jobType',
            type: 'select',
            required: true,
            options: [
                { label: 'Rebuild Aggregates', value: 'rebuild-aggregates' },
                { label: 'Sync Document', value: 'sync-document' },
                { label: 'Enrich Document', value: 'enrich-document' },
                { label: 'Initial Sync', value: 'initial-sync' },
            ],
        },
        {
            name: 'sourceCollection',
            type: 'text',
        },
        {
            name: 'sourceDocId',
            type: 'text',
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'pending',
            options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Processing', value: 'processing' },
                { label: 'Completed', value: 'completed' },
                { label: 'Failed', value: 'failed' },
            ],
        },
        {
            name: 'processedAt',
            type: 'date',
        },
        {
            name: 'errorMessage',
            type: 'text',
        },
    ],
};
//# sourceMappingURL=ai-sync-queue.js.map