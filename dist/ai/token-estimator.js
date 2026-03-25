/**
 * Token estimation and model recommendation engine.
 *
 * Estimates total token usage for AI enrichment across all content,
 * then recommends the cheapest model that can handle the workload.
 */ // --- Model Catalog ---
/**
 * Known models with pricing and context windows.
 * Updated as of March 2026. Users can override with custom model IDs.
 */ export const MODEL_CATALOG = [
    // OpenAI models
    {
        id: 'gpt-4.1-nano',
        provider: 'openai',
        name: 'GPT-4.1 Nano',
        contextWindow: 1047576,
        inputPricePerMTok: 0.10,
        outputPricePerMTok: 0.40,
        tier: 'budget',
        notes: 'Cheapest OpenAI option. Good for summaries and entity extraction.'
    },
    {
        id: 'gpt-4.1-mini',
        provider: 'openai',
        name: 'GPT-4.1 Mini',
        contextWindow: 1047576,
        inputPricePerMTok: 0.40,
        outputPricePerMTok: 1.60,
        tier: 'budget',
        notes: 'Best cost/quality balance for most enrichment tasks.'
    },
    {
        id: 'gpt-4o-mini',
        provider: 'openai',
        name: 'GPT-4o Mini',
        contextWindow: 128000,
        inputPricePerMTok: 0.15,
        outputPricePerMTok: 0.60,
        tier: 'budget',
        notes: 'Legacy budget model. Still effective for simple tasks.'
    },
    {
        id: 'gpt-4.1',
        provider: 'openai',
        name: 'GPT-4.1',
        contextWindow: 1047576,
        inputPricePerMTok: 2.00,
        outputPricePerMTok: 8.00,
        tier: 'standard',
        notes: 'High quality, large context. Overkill for most enrichment.'
    },
    {
        id: 'gpt-4o',
        provider: 'openai',
        name: 'GPT-4o',
        contextWindow: 128000,
        inputPricePerMTok: 2.50,
        outputPricePerMTok: 10.00,
        tier: 'standard',
        notes: 'Previous flagship. Good quality but pricier.'
    },
    // Anthropic models
    {
        id: 'claude-haiku-4-5-20251001',
        provider: 'anthropic',
        name: 'Claude 4.5 Haiku',
        contextWindow: 200000,
        inputPricePerMTok: 0.80,
        outputPricePerMTok: 4.00,
        tier: 'budget',
        notes: 'Fast and cheap Anthropic option. Great for structured extraction.'
    },
    {
        id: 'claude-sonnet-4-6-20260320',
        provider: 'anthropic',
        name: 'Claude Sonnet 4.6',
        contextWindow: 200000,
        inputPricePerMTok: 3.00,
        outputPricePerMTok: 15.00,
        tier: 'standard',
        notes: 'High quality Anthropic model. Better entity extraction.'
    },
    {
        id: 'claude-opus-4-6-20260320',
        provider: 'anthropic',
        name: 'Claude Opus 4.6',
        contextWindow: 1000000,
        inputPricePerMTok: 15.00,
        outputPricePerMTok: 75.00,
        tier: 'premium',
        notes: 'Top quality but expensive. Not recommended for bulk enrichment.'
    }
];
// --- Token Estimation ---
/**
 * Approximate token count from text.
 * Uses the ~4 chars per token heuristic (works for English, slightly underestimates for code/markdown).
 */ export function estimateTokens(text) {
    if (!text) return 0;
    // ~4 characters per token for English text, ~3.5 for mixed content
    return Math.ceil(text.length / 3.8);
}
/**
 * Estimate tokens for a single document's AI enrichment.
 */ export function estimateDocumentTokens(title, markdown, sourceCollection, sourceDocId) {
    const contentTokens = estimateTokens(markdown);
    // Summary and entities use first 4000 chars
    const summaryInputText = markdown.slice(0, 4000);
    const summaryInputTokens = estimateTokens(summaryInputText);
    // System prompts are ~50-100 tokens each
    const summarySystemTokens = 40;
    const entitiesSystemTokens = 100;
    const chunksSystemTokens = 80;
    // Chunks use first 6000 chars
    const chunksInputText = markdown.slice(0, 6000);
    const chunksInputTokens = estimateTokens(chunksInputText);
    // Estimated output tokens per call
    const summaryOutputTokens = 80 // 1-2 sentences
    ;
    const entitiesOutputTokens = 150 // JSON with topics, entities, category
    ;
    const chunksOutputTokens = Math.min(contentTokens * 1.2, 1500) // chunks are roughly the content reorganized
    ;
    return {
        sourceCollection,
        sourceDocId,
        title,
        contentTokens,
        truncatedTokens: estimateTokens(summaryInputText),
        calls: {
            summary: {
                inputTokens: summaryInputTokens + summarySystemTokens,
                outputTokens: summaryOutputTokens
            },
            entities: {
                inputTokens: summaryInputTokens + entitiesSystemTokens,
                outputTokens: entitiesOutputTokens
            },
            chunks: {
                inputTokens: chunksInputTokens + chunksSystemTokens,
                outputTokens: Math.ceil(chunksOutputTokens)
            }
        },
        totalInputTokens: summaryInputTokens + summarySystemTokens + (summaryInputTokens + entitiesSystemTokens) + (chunksInputTokens + chunksSystemTokens),
        totalOutputTokens: summaryOutputTokens + entitiesOutputTokens + Math.ceil(chunksOutputTokens)
    };
}
/**
 * Estimate the full AI enrichment job.
 */ export function estimateJob(documents, preferredProvider) {
    const needsEnrichment = documents.filter((d)=>!d.hasAiMeta && d.markdown);
    const perDocEstimates = needsEnrichment.map((doc)=>estimateDocumentTokens(doc.title, doc.markdown, doc.sourceCollection, doc.sourceDocId));
    const totalInputTokens = perDocEstimates.reduce((sum, d)=>sum + d.totalInputTokens, 0);
    const totalOutputTokens = perDocEstimates.reduce((sum, d)=>sum + d.totalOutputTokens, 0);
    // Find the single largest request (for context window requirement)
    let maxSingleRequest = 0;
    for (const doc of perDocEstimates){
        const summaryTotal = doc.calls.summary.inputTokens + doc.calls.summary.outputTokens;
        const entitiesTotal = doc.calls.entities.inputTokens + doc.calls.entities.outputTokens;
        const chunksTotal = doc.calls.chunks.inputTokens + doc.calls.chunks.outputTokens;
        maxSingleRequest = Math.max(maxSingleRequest, summaryTotal, entitiesTotal, chunksTotal);
    }
    // Filter models by preferred provider if specified
    const models = preferredProvider ? MODEL_CATALOG.filter((m)=>m.provider === preferredProvider) : MODEL_CATALOG;
    // Calculate cost for each model
    const costEstimates = models.map((model)=>{
        const inputCost = totalInputTokens / 1000000 * model.inputPricePerMTok;
        const outputCost = totalOutputTokens / 1000000 * model.outputPricePerMTok;
        const totalCost = inputCost + outputCost;
        const canHandle = model.contextWindow >= maxSingleRequest;
        return {
            model,
            inputCost: Math.round(inputCost * 10000) / 10000,
            outputCost: Math.round(outputCost * 10000) / 10000,
            totalCost: Math.round(totalCost * 10000) / 10000,
            canHandle,
            recommended: false,
            reason: canHandle ? '' : `Context window (${formatTokens(model.contextWindow)}) too small for largest request (${formatTokens(maxSingleRequest)})`
        };
    });
    // Find the recommendation: cheapest model that can handle the workload
    const viable = costEstimates.filter((c)=>c.canHandle).sort((a, b)=>a.totalCost - b.totalCost);
    let recommendation = null;
    if (viable.length > 0) {
        const best = viable[0];
        best.recommended = true;
        best.reason = `Cheapest model that fits. Estimated cost: $${best.totalCost.toFixed(4)}`;
        // Also mark the next tier up if it's significantly better
        if (viable.length > 1 && viable[1].model.tier !== best.model.tier) {
            viable[1].reason = `Higher quality alternative (+$${(viable[1].totalCost - best.totalCost).toFixed(4)})`;
        }
        recommendation = {
            model: best.model,
            totalCost: best.totalCost,
            reason: best.reason
        };
    }
    return {
        totalDocuments: documents.length,
        documentsNeedingEnrichment: needsEnrichment.length,
        perDocumentEstimates: perDocEstimates,
        totals: {
            totalInputTokens,
            totalOutputTokens,
            totalTokens: totalInputTokens + totalOutputTokens,
            maxSingleRequestTokens: maxSingleRequest
        },
        costEstimates,
        recommendation
    };
}
// --- Helpers ---
export function formatTokens(tokens) {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return String(tokens);
}
export function formatCost(cost) {
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    if (cost < 1) return `$${cost.toFixed(3)}`;
    return `$${cost.toFixed(2)}`;
}

//# sourceMappingURL=token-estimator.js.map