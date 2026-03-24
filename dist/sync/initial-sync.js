"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInitialSync = runInitialSync;
const transform_1 = require("../pipeline/transform");
/**
 * Run initial sync on first plugin start.
 * Scans all enabled collections and creates ai-content entries.
 */
async function runInitialSync(payload, pluginOptions, enabledCollections) {
    payload.logger.info(`[scrape-ai] Checking initial sync for ${enabledCollections.length} collections`);
    // Filter to only collections that have no ai-content entries yet
    const collectionsToSync = [];
    for (const slug of enabledCollections) {
        const existing = await payload.find({
            collection: 'ai-content',
            where: { sourceCollection: { equals: slug } },
            limit: 1,
        });
        if (existing.docs.length === 0) {
            collectionsToSync.push(slug);
        }
    }
    if (collectionsToSync.length === 0) {
        payload.logger.info('[scrape-ai] All collections already synced, skipping initial sync');
        return;
    }
    payload.logger.info(`[scrape-ai] Starting initial sync for ${collectionsToSync.length} collections: ${collectionsToSync.join(', ')}`);
    const concurrency = pluginOptions.sync.initialSyncConcurrency;
    for (const collectionSlug of collectionsToSync) {
        const collectionConfig = payload.collections[collectionSlug]?.config;
        if (!collectionConfig) {
            payload.logger.warn(`[scrape-ai] Collection '${collectionSlug}' not found, skipping`);
            continue;
        }
        // Query all documents in the collection (paginated)
        let page = 1;
        let hasMore = true;
        while (hasMore) {
            const result = await payload.find({
                collection: collectionSlug,
                limit: concurrency,
                page,
                sort: 'createdAt',
            });
            const docs = result.docs;
            // Process batch
            const promises = docs.map(async (doc) => {
                try {
                    // Check draft status
                    if (pluginOptions.drafts === 'published-only' && doc._status === 'draft') {
                        return;
                    }
                    const transformResult = (0, transform_1.transformDocument)({
                        doc: doc,
                        collectionSlug,
                        collectionConfig,
                        payload,
                        pluginOptions,
                    });
                    await payload.create({
                        collection: 'ai-content',
                        data: {
                            sourceCollection: collectionSlug,
                            sourceDocId: String(doc.id),
                            slug: transformResult.urlSlug,
                            title: transformResult.title,
                            canonicalUrl: transformResult.canonicalUrl,
                            markdown: transformResult.markdown,
                            jsonLd: transformResult.jsonLd,
                            status: 'synced',
                            parentSlug: transformResult.parentSlug || null,
                            relatedSlugs: transformResult.relatedSlugs,
                            locale: transformResult.locale || null,
                            isDraft: transformResult.isDraft,
                            lastSynced: new Date().toISOString(),
                            retryCount: 0,
                        },
                    });
                }
                catch (error) {
                    payload.logger.error(`[scrape-ai] Failed to sync ${collectionSlug}/${doc.id}: ${error.message}`);
                }
            });
            await Promise.all(promises);
            hasMore = result.hasNextPage;
            page++;
        }
        payload.logger.info(`[scrape-ai] Synced collection: ${collectionSlug}`);
    }
    // Queue aggregate rebuild
    await payload.create({
        collection: 'ai-sync-queue',
        data: {
            jobType: 'rebuild-aggregates',
            status: 'pending',
        },
    });
    payload.logger.info('[scrape-ai] Initial sync complete');
}
//# sourceMappingURL=initial-sync.js.map