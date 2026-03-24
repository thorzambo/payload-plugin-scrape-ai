/**
 * Creates an afterDelete hook that removes the corresponding ai-content entry
 * and queues an aggregate rebuild.
 */
export function createAfterDeleteHook(pluginOptions) {
    return async ({ doc, req, collection }) => {
        const { payload } = req;
        try {
            const collectionSlug = collection.slug;
            // Find and delete matching ai-content entries (all locales)
            const existing = await payload.find({
                collection: 'ai-content',
                where: {
                    sourceCollection: { equals: collectionSlug },
                    sourceDocId: { equals: String(doc.id) },
                },
                limit: 100,
            });
            for (const entry of existing.docs) {
                await payload.delete({
                    collection: 'ai-content',
                    id: entry.id,
                });
            }
            // Queue aggregate rebuild
            await payload.create({
                collection: 'ai-sync-queue',
                data: {
                    jobType: 'rebuild-aggregates',
                    status: 'pending',
                },
            });
        }
        catch (error) {
            payload.logger.error(`[scrape-ai] afterDelete error: ${error.message}`);
        }
        return doc;
    };
}
//# sourceMappingURL=afterDelete.js.map