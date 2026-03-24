const SYSTEM_PROMPT = `You are a content chunking assistant. Given a markdown document, split it into logical semantic sections suitable for RAG (retrieval-augmented generation) pipelines.

For each chunk, provide:
- id: a short kebab-case identifier
- topic: a brief topic label for the chunk
- content: the chunk's markdown content

Return ONLY valid JSON as an array:
[{"id": "...", "topic": "...", "content": "..."}]

Aim for 3-8 chunks. Each chunk should be self-contained and cover one topic.`;
export async function semanticChunk(markdown, provider) {
    // If no AI provider, fall back to heading-based chunking
    if (!provider) {
        return headingBasedChunk(markdown);
    }
    const truncated = markdown.slice(0, 6000);
    try {
        const result = await provider.complete(truncated, SYSTEM_PROMPT);
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed)) {
                return parsed.map((chunk, i) => ({
                    id: chunk.id || `chunk-${i}`,
                    topic: chunk.topic || `Section ${i + 1}`,
                    content: chunk.content || '',
                }));
            }
        }
    }
    catch {
        // Fall back to heading-based chunking
    }
    return headingBasedChunk(markdown);
}
/**
 * Simple heading-based chunking fallback (no AI needed).
 * Splits on ## headings.
 */
function headingBasedChunk(markdown) {
    // Remove frontmatter
    const content = markdown.replace(/^---[\s\S]*?---\n*/m, '');
    const sections = content.split(/(?=^## )/m).filter((s) => s.trim());
    if (sections.length === 0) {
        return [{ id: 'main', topic: 'Main Content', content: content.trim() }];
    }
    return sections.map((section, i) => {
        const headingMatch = section.match(/^## (.+)/m);
        const topic = headingMatch ? headingMatch[1].trim() : `Section ${i + 1}`;
        const id = topic
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        return {
            id: id || `section-${i}`,
            topic,
            content: section.trim(),
        };
    });
}
//# sourceMappingURL=chunk.js.map