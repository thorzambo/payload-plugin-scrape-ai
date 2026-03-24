import type { IAiProvider } from '../types';
export declare function semanticChunk(markdown: string, provider: IAiProvider | null): Promise<Array<{
    id: string;
    topic: string;
    content: string;
}>>;
//# sourceMappingURL=chunk.d.ts.map