import { describe, it, expect } from 'vitest';
import { semanticChunk } from './chunk';
describe('semanticChunk (heading-based fallback)', () => {
    it('splits on H2 headings', async () => {
        const content = '## Section 1\nContent 1\n\n## Section 2\nContent 2';
        const result = await semanticChunk(content, null);
        expect(result.length).toBe(2);
        expect(result[0].topic).toBe('Section 1');
        expect(result[1].topic).toBe('Section 2');
    });
    it('splits on H3 headings', async () => {
        const content = '### Sub 1\nContent 1\n\n### Sub 2\nContent 2';
        const result = await semanticChunk(content, null);
        expect(result.length).toBe(2);
        expect(result[0].topic).toBe('Sub 1');
        expect(result[1].topic).toBe('Sub 2');
    });
    it('returns single chunk for content without headings', async () => {
        const content = 'Just a paragraph of text without any headings.';
        const result = await semanticChunk(content, null);
        expect(result.length).toBe(1);
        // Without headings, the split returns the full content as one section;
        // the heading regex doesn't match, so topic falls back to "Section 1"
        expect(result[0].topic).toBe('Section 1');
        expect(result[0].content).toContain('Just a paragraph');
    });
    it('enforces max chunk size by splitting on paragraphs', async () => {
        // Create content with a single heading and >4000 chars
        const longParagraph = 'A'.repeat(2000);
        const content = `## Big Section\n\n${longParagraph}\n\n${longParagraph}\n\n${longParagraph}`;
        const result = await semanticChunk(content, null);
        for (const chunk of result) {
            expect(chunk.content.length).toBeLessThanOrEqual(4100);
        }
    });
    it('handles empty content', async () => {
        const result = await semanticChunk('', null);
        expect(result.length).toBeLessThanOrEqual(1);
    });
    it('generates kebab-case ids from headings', async () => {
        const content = '## My Great Section\nContent here';
        const result = await semanticChunk(content, null);
        expect(result[0].id).toBe('my-great-section');
    });
    it('strips frontmatter before chunking', async () => {
        const content = '---\ntitle: "Test"\nslug: "test"\n---\n\n## Section 1\nContent';
        const result = await semanticChunk(content, null);
        expect(result[0].content).not.toContain('---');
        expect(result[0].content).toContain('## Section 1');
    });
    it('handles mixed heading levels', async () => {
        const content = '## H2 Section\nContent\n\n### H3 Section\nMore content\n\n## Another H2\nFinal';
        const result = await semanticChunk(content, null);
        expect(result.length).toBe(3);
    });
    it('preserves content within chunks', async () => {
        const content = '## Section 1\nParagraph one.\n\nParagraph two.\n\n## Section 2\nParagraph three.';
        const result = await semanticChunk(content, null);
        expect(result[0].content).toContain('Paragraph one.');
        expect(result[0].content).toContain('Paragraph two.');
        expect(result[1].content).toContain('Paragraph three.');
    });
    it('labels oversized chunk parts correctly', async () => {
        const longParagraph = 'B'.repeat(2500);
        const content = `## Big\n\n${longParagraph}\n\n${longParagraph}`;
        const result = await semanticChunk(content, null);
        if (result.length > 1) {
            expect(result[0].topic).toContain('part');
            expect(result[0].id).toContain('part');
        }
    });
});
//# sourceMappingURL=chunk.test.js.map