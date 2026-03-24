import type { Payload } from 'payload';
/**
 * Generate comprehensive llms-full.txt with ALL synced entries.
 * Includes inline content excerpts so agents can get meaningful
 * content in a single request without hopping to each .md file.
 */
export declare function generateLlmsFullTxt(params: {
    payload: Payload;
    siteUrl: string;
    siteName: string;
    siteDescription: string;
}): Promise<string>;
//# sourceMappingURL=llms-full-txt.d.ts.map