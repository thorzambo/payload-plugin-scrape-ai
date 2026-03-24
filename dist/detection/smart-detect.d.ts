import type { Config } from 'payload';
import type { ScrapeAiPluginOptions } from '../types';
/**
 * Detect content collections by analyzing field signatures.
 * A collection is considered "content" if it has 2+ of these signals:
 * - A richText field
 * - A text field named 'title' or 'name'
 * - A text field named 'slug' or 'path'
 */
export declare function detectContentCollections(config: Config, options: ScrapeAiPluginOptions): string[];
//# sourceMappingURL=smart-detect.d.ts.map