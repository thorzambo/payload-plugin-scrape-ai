import { createAiProvider } from '../ai/provider';
import { estimateJob, MODEL_CATALOG, formatTokens, formatCost } from '../ai/token-estimator';
/**
 * Create all authenticated admin API endpoints for the dashboard.
 */
export function createAdminEndpoints(pluginOptions, pluginRawOptions) {
    return [
        // GET /api/scrape-ai/status
        {
            path: '/scrape-ai/status',
            method: 'get',
            handler: async (req) => {
                if (!req.user)
                    return Response.json({ error: 'Unauthorized' }, { status: 401 });
                const { payload } = req;
                try {
                    const [allEntries, pendingEntries, errorEntries, aiConfig] = await Promise.all([
                        payload.find({
                            collection: 'ai-content',
                            where: { sourceCollection: { not_equals: '__aggregate' } },
                            limit: 0,
                        }),
                        payload.find({
                            collection: 'ai-content',
                            where: { sourceCollection: { not_equals: '__aggregate' }, status: { equals: 'pending' } },
                            limit: 0,
                        }),
                        payload.find({
                            collection: 'ai-content',
                            where: {
                                sourceCollection: { not_equals: '__aggregate' },
                                status: { in: ['error', 'error-permanent'] },
                            },
                            limit: 0,
                        }),
                        payload.findGlobal({ slug: 'ai-config' }).catch(() => null),
                    ]);
                    // Count per collection
                    const collectionCounts = {};
                    // We can't group-by with Payload local API, so we query per collection
                    const enabledCollections = aiConfig?.enabledCollections || {};
                    for (const slug of Object.keys(enabledCollections)) {
                        if (!enabledCollections[slug])
                            continue;
                        const count = await payload.find({
                            collection: 'ai-content',
                            where: { sourceCollection: { equals: slug } },
                            limit: 0,
                        });
                        collectionCounts[slug] = count.totalDocs;
                    }
                    return Response.json({
                        totalEntries: allEntries.totalDocs,
                        pendingCount: pendingEntries.totalDocs,
                        errorCount: errorEntries.totalDocs,
                        collections: collectionCounts,
                        lastRebuild: aiConfig?.lastAggregateRebuild || null,
                        aiEnabled: aiConfig?.aiEnabled || false,
                        aiProvider: aiConfig?.aiProvider || null,
                        aiModel: aiConfig?.aiModel || null,
                        aiApiCallCount: aiConfig?.aiApiCallCount || 0,
                    });
                }
                catch (error) {
                    return Response.json({ error: error.message }, { status: 500 });
                }
            },
        },
        // GET /api/scrape-ai/entries
        {
            path: '/scrape-ai/entries',
            method: 'get',
            handler: async (req) => {
                if (!req.user)
                    return Response.json({ error: 'Unauthorized' }, { status: 401 });
                const { payload } = req;
                const url = new URL(req.url || '', 'http://localhost');
                const page = parseInt(url.searchParams.get('page') || '1', 10);
                const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
                const collection = url.searchParams.get('collection');
                const status = url.searchParams.get('status');
                const where = {
                    sourceCollection: { not_equals: '__aggregate' },
                };
                if (collection)
                    where.sourceCollection = { equals: collection };
                if (status)
                    where.status = { equals: status };
                try {
                    const result = await payload.find({
                        collection: 'ai-content',
                        where,
                        page,
                        limit,
                        sort: '-lastSynced',
                    });
                    return Response.json({
                        docs: result.docs.map((doc) => ({
                            id: doc.id,
                            title: doc.title,
                            slug: doc.slug,
                            sourceCollection: doc.sourceCollection,
                            status: doc.status,
                            lastSynced: doc.lastSynced,
                            hasAiMeta: Boolean(doc.aiMeta),
                            isDraft: doc.isDraft,
                            errorMessage: doc.errorMessage,
                        })),
                        totalDocs: result.totalDocs,
                        page: result.page,
                        totalPages: result.totalPages,
                        hasNextPage: result.hasNextPage,
                    });
                }
                catch (error) {
                    return Response.json({ error: error.message }, { status: 500 });
                }
            },
        },
        // GET /api/scrape-ai/entry/:id
        {
            path: '/scrape-ai/entry/:id',
            method: 'get',
            handler: async (req) => {
                if (!req.user)
                    return Response.json({ error: 'Unauthorized' }, { status: 401 });
                const { payload } = req;
                const id = req.routeParams?.id;
                try {
                    const doc = await payload.findByID({ collection: 'ai-content', id });
                    return Response.json(doc);
                }
                catch (error) {
                    return Response.json({ error: error.message }, { status: 404 });
                }
            },
        },
        // POST /api/scrape-ai/regenerate
        {
            path: '/scrape-ai/regenerate',
            method: 'post',
            handler: async (req) => {
                if (!req.user)
                    return Response.json({ error: 'Unauthorized' }, { status: 401 });
                const { payload } = req;
                try {
                    const body = await req.json?.() || {};
                    if (body.all) {
                        // Delete all non-aggregate entries to trigger full re-sync
                        const all = await payload.find({
                            collection: 'ai-content',
                            where: { sourceCollection: { not_equals: '__aggregate' } },
                            limit: 10000,
                        });
                        for (const doc of all.docs) {
                            await payload.delete({ collection: 'ai-content', id: doc.id });
                        }
                        // Initial sync will re-run on next scheduler tick
                        return Response.json({ message: 'Full regeneration queued', count: all.totalDocs });
                    }
                    if (body.ids && Array.isArray(body.ids)) {
                        for (const id of body.ids) {
                            await payload.update({
                                collection: 'ai-content',
                                id,
                                data: { status: 'pending', retryCount: 0, errorMessage: null },
                            });
                        }
                        return Response.json({ message: 'Regeneration queued', count: body.ids.length });
                    }
                    return Response.json({ error: 'Provide { all: true } or { ids: [...] }' }, { status: 400 });
                }
                catch (error) {
                    return Response.json({ error: error.message }, { status: 500 });
                }
            },
        },
        // POST /api/scrape-ai/toggle-collection
        {
            path: '/scrape-ai/toggle-collection',
            method: 'post',
            handler: async (req) => {
                if (!req.user)
                    return Response.json({ error: 'Unauthorized' }, { status: 401 });
                const { payload } = req;
                try {
                    const body = await req.json?.() || {};
                    const { collection: slug, enabled } = body;
                    if (!slug || typeof enabled !== 'boolean') {
                        return Response.json({ error: 'Provide { collection, enabled }' }, { status: 400 });
                    }
                    const aiConfig = await payload.findGlobal({ slug: 'ai-config' });
                    const currentEnabled = aiConfig?.enabledCollections || {};
                    await payload.updateGlobal({
                        slug: 'ai-config',
                        data: {
                            enabledCollections: { ...currentEnabled, [slug]: enabled },
                        },
                    });
                    return Response.json({ message: `Collection '${slug}' ${enabled ? 'enabled' : 'disabled'}` });
                }
                catch (error) {
                    return Response.json({ error: error.message }, { status: 500 });
                }
            },
        },
        // POST /api/scrape-ai/ai-settings
        {
            path: '/scrape-ai/ai-settings',
            method: 'post',
            handler: async (req) => {
                if (!req.user)
                    return Response.json({ error: 'Unauthorized' }, { status: 401 });
                const { payload } = req;
                try {
                    const body = await req.json?.() || {};
                    const data = {};
                    if (typeof body.aiEnabled === 'boolean')
                        data.aiEnabled = body.aiEnabled;
                    if (body.aiProvider)
                        data.aiProvider = body.aiProvider;
                    if (body.aiApiKey)
                        data.aiApiKey = body.aiApiKey;
                    if (body.aiModel)
                        data.aiModel = body.aiModel;
                    await payload.updateGlobal({ slug: 'ai-config', data });
                    return Response.json({ message: 'AI settings updated' });
                }
                catch (error) {
                    return Response.json({ error: error.message }, { status: 500 });
                }
            },
        },
        // POST /api/scrape-ai/test-ai
        {
            path: '/scrape-ai/test-ai',
            method: 'post',
            handler: async (req) => {
                if (!req.user)
                    return Response.json({ error: 'Unauthorized' }, { status: 401 });
                const { payload } = req;
                try {
                    const aiConfig = await payload.findGlobal({ slug: 'ai-config' });
                    const provider = aiConfig?.aiProvider;
                    const apiKey = aiConfig?.aiApiKey || pluginOptions.ai?.apiKey;
                    const model = aiConfig?.aiModel;
                    if (!provider || !apiKey) {
                        return Response.json({ success: false, error: 'No AI provider configured' });
                    }
                    const ai = await createAiProvider({ provider, apiKey, model });
                    if (!ai) {
                        return Response.json({ success: false, error: 'Failed to create AI provider' });
                    }
                    const result = await ai.complete('Say "hello" in one word.', 'You are a test assistant.');
                    return Response.json({ success: true, response: result });
                }
                catch (error) {
                    return Response.json({ success: false, error: error.message });
                }
            },
        },
        // GET /api/scrape-ai/llms-txt-config
        {
            path: '/scrape-ai/llms-txt-config',
            method: 'get',
            handler: async (req) => {
                if (!req.user)
                    return Response.json({ error: 'Unauthorized' }, { status: 401 });
                const { payload } = req;
                try {
                    const aiConfig = await payload.findGlobal({ slug: 'ai-config' });
                    return Response.json({
                        priority: aiConfig?.llmsTxtPriority || [],
                        sections: aiConfig?.llmsTxtSections || [],
                    });
                }
                catch (error) {
                    return Response.json({ error: error.message }, { status: 500 });
                }
            },
        },
        // POST /api/scrape-ai/llms-txt-config
        {
            path: '/scrape-ai/llms-txt-config',
            method: 'post',
            handler: async (req) => {
                if (!req.user)
                    return Response.json({ error: 'Unauthorized' }, { status: 401 });
                const { payload } = req;
                try {
                    const body = await req.json?.() || {};
                    const data = {};
                    if (body.priority)
                        data.llmsTxtPriority = body.priority;
                    if (body.sections)
                        data.llmsTxtSections = body.sections;
                    await payload.updateGlobal({ slug: 'ai-config', data });
                    // Queue aggregate rebuild
                    await payload.create({
                        collection: 'ai-sync-queue',
                        data: { jobType: 'rebuild-aggregates', status: 'pending' },
                    });
                    return Response.json({ message: 'llms.txt config updated, rebuild queued' });
                }
                catch (error) {
                    return Response.json({ error: error.message }, { status: 500 });
                }
            },
        },
        // GET /api/scrape-ai/detected-collections
        {
            path: '/scrape-ai/detected-collections',
            method: 'get',
            handler: async (req) => {
                if (!req.user)
                    return Response.json({ error: 'Unauthorized' }, { status: 401 });
                const { payload } = req;
                try {
                    const aiConfig = await payload.findGlobal({ slug: 'ai-config' });
                    const enabledCollections = aiConfig?.enabledCollections || {};
                    // Get all non-plugin collections
                    const allCollections = Object.keys(payload.collections).filter((slug) => !['ai-content', 'ai-sync-queue'].includes(slug));
                    const result = await Promise.all(allCollections.map(async (slug) => {
                        const count = await payload.find({
                            collection: slug,
                            limit: 0,
                        });
                        return {
                            slug,
                            label: payload.collections[slug]?.config?.labels?.plural || slug,
                            docCount: count.totalDocs,
                            enabled: enabledCollections[slug] === true,
                        };
                    }));
                    return Response.json({ collections: result });
                }
                catch (error) {
                    return Response.json({ error: error.message }, { status: 500 });
                }
            },
        },
        // GET /api/scrape-ai/token-estimate
        {
            path: '/scrape-ai/token-estimate',
            method: 'get',
            handler: async (req) => {
                if (!req.user)
                    return Response.json({ error: 'Unauthorized' }, { status: 401 });
                const { payload } = req;
                const url = new URL(req.url || '', 'http://localhost');
                const providerFilter = url.searchParams.get('provider');
                try {
                    // Fetch all ai-content entries
                    const allContent = await payload.find({
                        collection: 'ai-content',
                        where: { sourceCollection: { not_equals: '__aggregate' } },
                        limit: 10000,
                    });
                    const documents = allContent.docs.map((doc) => ({
                        title: doc.title || '',
                        markdown: doc.markdown || '',
                        sourceCollection: doc.sourceCollection || '',
                        sourceDocId: doc.sourceDocId || '',
                        hasAiMeta: Boolean(doc.aiMeta && Object.keys(doc.aiMeta).length > 0),
                    }));
                    const estimate = estimateJob(documents, providerFilter || undefined);
                    // Format for the dashboard
                    return Response.json({
                        totalDocuments: estimate.totalDocuments,
                        documentsNeedingEnrichment: estimate.documentsNeedingEnrichment,
                        totals: {
                            totalInputTokens: estimate.totals.totalInputTokens,
                            totalOutputTokens: estimate.totals.totalOutputTokens,
                            totalTokens: estimate.totals.totalTokens,
                            maxSingleRequestTokens: estimate.totals.maxSingleRequestTokens,
                            formatted: {
                                totalInputTokens: formatTokens(estimate.totals.totalInputTokens),
                                totalOutputTokens: formatTokens(estimate.totals.totalOutputTokens),
                                totalTokens: formatTokens(estimate.totals.totalTokens),
                                maxSingleRequest: formatTokens(estimate.totals.maxSingleRequestTokens),
                            },
                        },
                        costEstimates: estimate.costEstimates.map((c) => ({
                            modelId: c.model.id,
                            modelName: c.model.name,
                            provider: c.model.provider,
                            tier: c.model.tier,
                            contextWindow: c.model.contextWindow,
                            contextWindowFormatted: formatTokens(c.model.contextWindow),
                            inputCost: c.inputCost,
                            outputCost: c.outputCost,
                            totalCost: c.totalCost,
                            totalCostFormatted: formatCost(c.totalCost),
                            canHandle: c.canHandle,
                            recommended: c.recommended,
                            reason: c.reason,
                            notes: c.model.notes,
                        })),
                        recommendation: estimate.recommendation
                            ? {
                                modelId: estimate.recommendation.model.id,
                                modelName: estimate.recommendation.model.name,
                                provider: estimate.recommendation.model.provider,
                                totalCost: estimate.recommendation.totalCost,
                                totalCostFormatted: formatCost(estimate.recommendation.totalCost),
                                reason: estimate.recommendation.reason,
                            }
                            : null,
                        // Per-document breakdown (top 10 largest by token count)
                        largestDocuments: estimate.perDocumentEstimates
                            .sort((a, b) => b.contentTokens - a.contentTokens)
                            .slice(0, 10)
                            .map((d) => ({
                            title: d.title,
                            sourceCollection: d.sourceCollection,
                            contentTokens: d.contentTokens,
                            contentTokensFormatted: formatTokens(d.contentTokens),
                            totalInputTokens: d.totalInputTokens,
                            totalOutputTokens: d.totalOutputTokens,
                            callsBreakdown: {
                                summary: `${formatTokens(d.calls.summary.inputTokens)} in / ${formatTokens(d.calls.summary.outputTokens)} out`,
                                entities: `${formatTokens(d.calls.entities.inputTokens)} in / ${formatTokens(d.calls.entities.outputTokens)} out`,
                                chunks: `${formatTokens(d.calls.chunks.inputTokens)} in / ${formatTokens(d.calls.chunks.outputTokens)} out`,
                            },
                        })),
                    });
                }
                catch (error) {
                    return Response.json({ error: error.message }, { status: 500 });
                }
            },
        },
        // GET /api/scrape-ai/model-catalog
        {
            path: '/scrape-ai/model-catalog',
            method: 'get',
            handler: async (req) => {
                if (!req.user)
                    return Response.json({ error: 'Unauthorized' }, { status: 401 });
                return Response.json({
                    models: MODEL_CATALOG.map((m) => ({
                        id: m.id,
                        name: m.name,
                        provider: m.provider,
                        contextWindow: m.contextWindow,
                        contextWindowFormatted: formatTokens(m.contextWindow),
                        inputPricePerMTok: m.inputPricePerMTok,
                        outputPricePerMTok: m.outputPricePerMTok,
                        tier: m.tier,
                        notes: m.notes,
                    })),
                });
            },
        },
    ];
}
//# sourceMappingURL=admin-api.js.map