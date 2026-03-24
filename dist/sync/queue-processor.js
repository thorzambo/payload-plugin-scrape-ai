"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQueue = processQueue;
const transform_1 = require("../pipeline/transform");
const llms_txt_1 = require("../generators/llms-txt");
const llms_full_txt_1 = require("../generators/llms-full-txt");
const sitemap_1 = require("../generators/sitemap");
/**
 * Process pending jobs from the ai-sync-queue.
 */
async function processQueue(payload, pluginOptions, aiProvider) {
    // Process enrich-document jobs first
    if (aiProvider) {
        await processEnrichJobs(payload, aiProvider);
    }
    // Process rebuild-aggregates jobs
    await processRebuildJobs(payload, pluginOptions);
}
async function processEnrichJobs(payload, aiProvider) {
    const pendingJobs = await payload.find({
        collection: 'ai-sync-queue',
        where: {
            jobType: { equals: 'enrich-document' },
            status: { equals: 'pending' },
        },
        limit: 10,
        sort: 'createdAt',
    });
    for (const job of pendingJobs.docs) {
        try {
            // Mark as processing
            await payload.update({
                collection: 'ai-sync-queue',
                id: job.id,
                data: { status: 'processing' },
            });
            const sourceCollection = job.sourceCollection;
            const sourceDocId = job.sourceDocId;
            if (!sourceCollection || !sourceDocId) {
                await payload.update({
                    collection: 'ai-sync-queue',
                    id: job.id,
                    data: { status: 'failed', errorMessage: 'Missing sourceCollection or sourceDocId' },
                });
                continue;
            }
            // Find the ai-content entry
            const contentResult = await payload.find({
                collection: 'ai-content',
                where: {
                    sourceCollection: { equals: sourceCollection },
                    sourceDocId: { equals: sourceDocId },
                },
                limit: 1,
            });
            if (contentResult.docs.length === 0) {
                await payload.update({
                    collection: 'ai-sync-queue',
                    id: job.id,
                    data: { status: 'completed', processedAt: new Date().toISOString() },
                });
                continue;
            }
            const contentEntry = contentResult.docs[0];
            const markdown = contentEntry.markdown;
            if (!markdown) {
                await payload.update({
                    collection: 'ai-sync-queue',
                    id: job.id,
                    data: { status: 'completed', processedAt: new Date().toISOString() },
                });
                continue;
            }
            // Run AI enrichment
            const aiMeta = await (0, transform_1.enrichDocument)(markdown, aiProvider);
            // Update the ai-content entry with AI metadata
            await payload.update({
                collection: 'ai-content',
                id: contentEntry.id,
                data: { aiMeta },
            });
            // Increment API call counter
            try {
                const aiConfig = await payload.findGlobal({ slug: 'ai-config' });
                const currentCount = aiConfig?.aiApiCallCount || 0;
                await payload.updateGlobal({
                    slug: 'ai-config',
                    data: { aiApiCallCount: currentCount + 3 }, // 3 calls per enrichment (summary, entities, chunks)
                });
            }
            catch {
                // Non-critical
            }
            await payload.update({
                collection: 'ai-sync-queue',
                id: job.id,
                data: { status: 'completed', processedAt: new Date().toISOString() },
            });
        }
        catch (error) {
            payload.logger.error(`[scrape-ai] Enrich job failed: ${error.message}`);
            await payload.update({
                collection: 'ai-sync-queue',
                id: job.id,
                data: { status: 'failed', errorMessage: error.message },
            });
        }
    }
}
async function processRebuildJobs(payload, pluginOptions) {
    const pendingJobs = await payload.find({
        collection: 'ai-sync-queue',
        where: {
            jobType: { equals: 'rebuild-aggregates' },
            status: { equals: 'pending' },
        },
        limit: 100,
    });
    if (pendingJobs.docs.length === 0)
        return;
    // Mark all as processing
    for (const job of pendingJobs.docs) {
        await payload.update({
            collection: 'ai-sync-queue',
            id: job.id,
            data: { status: 'processing' },
        });
    }
    try {
        // Generate all aggregates in one pass
        const [llmsTxt, llmsFullTxt, sitemap] = await Promise.all([
            (0, llms_txt_1.generateLlmsTxt)({
                payload,
                siteUrl: pluginOptions.siteUrl,
                siteName: pluginOptions.siteName,
                siteDescription: pluginOptions.siteDescription,
            }),
            (0, llms_full_txt_1.generateLlmsFullTxt)({
                payload,
                siteUrl: pluginOptions.siteUrl,
                siteName: pluginOptions.siteName,
                siteDescription: pluginOptions.siteDescription,
            }),
            (0, sitemap_1.generateAiSitemap)({
                payload,
                siteUrl: pluginOptions.siteUrl,
                siteName: pluginOptions.siteName,
            }),
        ]);
        // Upsert aggregate entries
        await upsertAggregate(payload, '__llms-txt', 'llms.txt', llmsTxt);
        await upsertAggregate(payload, '__llms-full-txt', 'llms-full.txt', llmsFullTxt);
        await upsertAggregate(payload, '__sitemap-json', 'sitemap.json', JSON.stringify(sitemap, null, 2));
        // Update last rebuild timestamp
        await payload.updateGlobal({
            slug: 'ai-config',
            data: { lastAggregateRebuild: new Date().toISOString() },
        });
        // Mark all jobs as completed
        for (const job of pendingJobs.docs) {
            await payload.update({
                collection: 'ai-sync-queue',
                id: job.id,
                data: { status: 'completed', processedAt: new Date().toISOString() },
            });
        }
    }
    catch (error) {
        payload.logger.error(`[scrape-ai] Aggregate rebuild failed: ${error.message}`);
        for (const job of pendingJobs.docs) {
            await payload.update({
                collection: 'ai-sync-queue',
                id: job.id,
                data: { status: 'failed', errorMessage: error.message },
            });
        }
    }
}
async function upsertAggregate(payload, sourceDocId, title, content) {
    const existing = await payload.find({
        collection: 'ai-content',
        where: {
            sourceCollection: { equals: '__aggregate' },
            sourceDocId: { equals: sourceDocId },
        },
        limit: 1,
    });
    const data = {
        sourceCollection: '__aggregate',
        sourceDocId,
        slug: sourceDocId,
        title,
        markdown: content,
        status: 'synced',
        lastSynced: new Date().toISOString(),
    };
    if (existing.docs.length > 0) {
        await payload.update({
            collection: 'ai-content',
            id: existing.docs[0].id,
            data,
        });
    }
    else {
        await payload.create({
            collection: 'ai-content',
            data,
        });
    }
}
//# sourceMappingURL=queue-processor.js.map