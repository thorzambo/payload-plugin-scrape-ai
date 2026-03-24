import type { IAiProvider } from '../types';
export declare function extractEntities(markdown: string, provider: IAiProvider): Promise<{
    topics: string[];
    entities: string[];
    category: string;
}>;
//# sourceMappingURL=entities.d.ts.map