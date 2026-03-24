/**
 * Token estimation and model recommendation engine.
 *
 * Estimates total token usage for AI enrichment across all content,
 * then recommends the cheapest model that can handle the workload.
 */
export interface ModelInfo {
    id: string;
    provider: 'openai' | 'anthropic';
    name: string;
    contextWindow: number;
    inputPricePerMTok: number;
    outputPricePerMTok: number;
    tier: 'budget' | 'standard' | 'premium';
    notes: string;
}
/**
 * Known models with pricing and context windows.
 * Updated as of March 2026. Users can override with custom model IDs.
 */
export declare const MODEL_CATALOG: ModelInfo[];
/**
 * Approximate token count from text.
 * Uses the ~4 chars per token heuristic (works for English, slightly underestimates for code/markdown).
 */
export declare function estimateTokens(text: string): number;
/**
 * Per-document token breakdown for AI enrichment.
 * Each document triggers 3 AI calls: summary, entities, chunks.
 */
export interface DocumentTokenEstimate {
    sourceCollection: string;
    sourceDocId: string;
    title: string;
    contentTokens: number;
    truncatedTokens: number;
    calls: {
        summary: {
            inputTokens: number;
            outputTokens: number;
        };
        entities: {
            inputTokens: number;
            outputTokens: number;
        };
        chunks: {
            inputTokens: number;
            outputTokens: number;
        };
    };
    totalInputTokens: number;
    totalOutputTokens: number;
}
/**
 * Estimate tokens for a single document's AI enrichment.
 */
export declare function estimateDocumentTokens(title: string, markdown: string, sourceCollection: string, sourceDocId: string): DocumentTokenEstimate;
export interface JobEstimate {
    totalDocuments: number;
    documentsNeedingEnrichment: number;
    perDocumentEstimates: DocumentTokenEstimate[];
    totals: {
        totalInputTokens: number;
        totalOutputTokens: number;
        totalTokens: number;
        maxSingleRequestTokens: number;
    };
    costEstimates: Array<{
        model: ModelInfo;
        inputCost: number;
        outputCost: number;
        totalCost: number;
        canHandle: boolean;
        recommended: boolean;
        reason: string;
    }>;
    recommendation: {
        model: ModelInfo;
        totalCost: number;
        reason: string;
    } | null;
}
/**
 * Estimate the full AI enrichment job.
 */
export declare function estimateJob(documents: Array<{
    title: string;
    markdown: string;
    sourceCollection: string;
    sourceDocId: string;
    hasAiMeta: boolean;
}>, preferredProvider?: 'openai' | 'anthropic'): JobEstimate;
export declare function formatTokens(tokens: number): string;
export declare function formatCost(cost: number): string;
//# sourceMappingURL=token-estimator.d.ts.map