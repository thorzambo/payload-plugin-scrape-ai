"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformDocument = transformDocument;
exports.enrichDocument = enrichDocument;
const extract_1 = require("./extract");
const structure_1 = require("./structure");
const enrich_1 = require("./enrich");
/**
 * Run Stage 1 + 2 of the pipeline (synchronous, fast, no AI).
 * Used in the afterChange hook — must be fast and never fail.
 */
function transformDocument(params) {
    const { doc, collectionSlug, collectionConfig, payload, pluginOptions, locale, allContent } = params;
    // Stage 1: Extract
    const rawMarkdown = (0, extract_1.extractDocument)(doc, collectionConfig, payload);
    // Stage 2: Structure
    const result = (0, structure_1.structureContent)({
        markdown: rawMarkdown,
        doc,
        collectionSlug,
        collectionConfig,
        siteUrl: pluginOptions.siteUrl,
        siteName: pluginOptions.siteName,
        locale,
        allContent,
    });
    return result;
}
/**
 * Run Stage 3 (AI enrichment). Called asynchronously via the queue.
 * Returns AI metadata to merge into the ai-content entry.
 */
async function enrichDocument(markdown, aiProvider) {
    return (0, enrich_1.enrichContent)(markdown, aiProvider);
}
//# sourceMappingURL=transform.js.map