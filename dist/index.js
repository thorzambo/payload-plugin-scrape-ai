"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeAiPlugin = void 0;
const ai_content_1 = require("./collections/ai-content");
const ai_sync_queue_1 = require("./collections/ai-sync-queue");
const ai_config_1 = require("./globals/ai-config");
const smart_detect_1 = require("./detection/smart-detect");
const afterChange_1 = require("./hooks/afterChange");
const afterDelete_1 = require("./hooks/afterDelete");
const llms_txt_1 = require("./endpoints/llms-txt");
const llms_full_txt_1 = require("./endpoints/llms-full-txt");
const content_markdown_1 = require("./endpoints/content-markdown");
const sitemap_json_1 = require("./endpoints/sitemap-json");
const structured_data_1 = require("./endpoints/structured-data");
const context_query_1 = require("./endpoints/context-query");
const admin_api_1 = require("./endpoints/admin-api");
const rate_limiter_1 = require("./endpoints/rate-limiter");
const scheduler_1 = require("./sync/scheduler");
const initial_sync_1 = require("./sync/initial-sync");
const provider_1 = require("./ai/provider");
const scrapeAiPlugin = (options) => (incomingConfig) => {
    if (!options.siteUrl) {
        throw new Error('[scrape-ai] siteUrl is required. Please provide the base URL of your website.');
    }
    const config = { ...incomingConfig };
    const resolvedConfig = {
        enabledCollections: [], // resolved in onInit
        siteUrl: options.siteUrl.replace(/\/$/, ''),
        siteName: options.siteName || 'My Website',
        siteDescription: options.siteDescription || '',
        drafts: options.drafts || 'published-only',
        sync: {
            debounceMs: options.sync?.debounceMs ?? 30000,
            initialSyncConcurrency: options.sync?.initialSyncConcurrency ?? 5,
            rateLimitPerMinute: options.sync?.rateLimitPerMinute ?? 60,
        },
        ai: options.ai,
    };
    // Always add collections and global for schema consistency
    config.collections = [
        ...(config.collections || []),
        ai_content_1.aiContentCollection,
        ai_sync_queue_1.aiSyncQueueCollection,
    ];
    config.globals = [
        ...(config.globals || []),
        ai_config_1.aiConfigGlobal,
    ];
    if (options.enabled === false)
        return config;
    // --- Detect target collections ---
    const detectedCollections = (0, smart_detect_1.detectContentCollections)(config, options);
    resolvedConfig.enabledCollections = detectedCollections;
    // --- Inject hooks into target collections ---
    config.collections = config.collections.map((collection) => {
        if (!detectedCollections.includes(collection.slug))
            return collection;
        return {
            ...collection,
            hooks: {
                ...collection.hooks,
                afterChange: [
                    ...(collection.hooks?.afterChange || []),
                    (0, afterChange_1.createAfterChangeHook)(resolvedConfig, collection),
                ],
                afterDelete: [
                    ...(collection.hooks?.afterDelete || []),
                    (0, afterDelete_1.createAfterDeleteHook)(resolvedConfig),
                ],
            },
        };
    });
    // --- Register public endpoints ---
    const rateLimiter = new rate_limiter_1.RateLimiter(resolvedConfig.sync.rateLimitPerMinute);
    config.endpoints = [
        ...(config.endpoints ?? []),
        (0, llms_txt_1.createLlmsTxtEndpoint)(rateLimiter),
        (0, llms_full_txt_1.createLlmsFullTxtEndpoint)(rateLimiter),
        (0, sitemap_json_1.createSitemapJsonEndpoint)(rateLimiter),
        (0, content_markdown_1.createContentMarkdownEndpoint)(rateLimiter),
        (0, structured_data_1.createStructuredDataEndpoint)(rateLimiter),
        (0, context_query_1.createContextQueryEndpoint)(rateLimiter, resolvedConfig.siteUrl),
        ...(0, admin_api_1.createAdminEndpoints)(resolvedConfig, options),
    ];
    // --- Register admin view ---
    config.admin = {
        ...(config.admin || {}),
        components: {
            ...(config.admin?.components || {}),
            views: {
                ...(config.admin?.components?.views || {}),
                scrapeAi: {
                    Component: 'payload-plugin-scrape-ai/dist/admin/views/Dashboard',
                    path: '/scrape-ai',
                },
            },
            afterNavLinks: [
                ...(config.admin?.components?.afterNavLinks || []),
                'payload-plugin-scrape-ai/dist/admin/components/NavLink',
            ],
        },
    };
    // --- Extend onInit ---
    const existingOnInit = incomingConfig.onInit;
    config.onInit = async (payload) => {
        if (existingOnInit)
            await existingOnInit(payload);
        payload.logger.info('[scrape-ai] Plugin initializing...');
        // Initialize enabled collections in ai-config global
        try {
            const aiConfig = await payload.findGlobal({ slug: 'ai-config' });
            const currentEnabled = aiConfig?.enabledCollections || {};
            const needsUpdate = detectedCollections.some((slug) => currentEnabled[slug] === undefined);
            if (needsUpdate) {
                const updated = { ...currentEnabled };
                for (const slug of detectedCollections) {
                    if (updated[slug] === undefined) {
                        updated[slug] = true;
                    }
                }
                await payload.updateGlobal({
                    slug: 'ai-config',
                    data: { enabledCollections: updated },
                });
            }
        }
        catch (error) {
            payload.logger.warn(`[scrape-ai] Could not initialize ai-config: ${error.message}`);
        }
        // Resolve AI provider
        let aiProvider = null;
        try {
            const aiConfig = await payload.findGlobal({ slug: 'ai-config' });
            aiProvider = await (0, provider_1.resolveAiProvider)(options.ai, aiConfig);
        }
        catch {
            aiProvider = options.ai ? await (0, provider_1.resolveAiProvider)(options.ai) : null;
        }
        // Run initial sync
        await (0, initial_sync_1.runInitialSync)(payload, resolvedConfig, detectedCollections);
        // Start background scheduler
        (0, scheduler_1.startScheduler)(payload, resolvedConfig, aiProvider);
        payload.logger.info('[scrape-ai] Plugin initialized successfully');
    };
    return config;
};
exports.scrapeAiPlugin = scrapeAiPlugin;
//# sourceMappingURL=index.js.map