import type { Plugin } from 'payload';
import type { ScrapeAiPluginOptions } from './types';
export type { ScrapeAiPluginOptions } from './types';
export { generateHeadTags, getDiscoveryLinks } from './discovery/head-tags';
export { ScrapeAiMeta } from './discovery/ScrapeAiMeta';
export { ScrapeAiFooterTag } from './discovery/ScrapeAiFooterTag';
export { withScrapeAi } from './next';
export declare const scrapeAiPlugin: (options: ScrapeAiPluginOptions) => Plugin;
//# sourceMappingURL=index.d.ts.map