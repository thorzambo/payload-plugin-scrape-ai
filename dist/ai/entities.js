const SYSTEM_PROMPT = `You are a content analyzer. Given a markdown document, extract:
1. topics: array of 3-8 key topics/themes (lowercase, short phrases)
2. entities: array of named entities (people, companies, places, products mentioned)
3. category: a single content category classification (e.g., "Technology", "Marketing", "Legal", "E-commerce", "Education", etc.)

Return ONLY valid JSON in this exact format:
{"topics": [...], "entities": [...], "category": "..."}`;
export async function extractEntities(markdown, provider) {
    const truncated = markdown.slice(0, 4000);
    const result = await provider.complete(truncated, SYSTEM_PROMPT);
    try {
        // Try to extract JSON from the response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            parsed.topics = (parsed.topics || []).slice(0, 10);
            parsed.entities = (parsed.entities || []).slice(0, 20);
            return {
                topics: Array.isArray(parsed.topics) ? parsed.topics : [],
                entities: Array.isArray(parsed.entities) ? parsed.entities : [],
                category: typeof parsed.category === 'string' ? parsed.category : 'General',
            };
        }
    }
    catch {
        // JSON parse failed — return defaults
    }
    return { topics: [], entities: [], category: 'General' };
}
//# sourceMappingURL=entities.js.map