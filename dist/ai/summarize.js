const SYSTEM_PROMPT = `You are a content summarizer. Given a markdown document, produce a concise 1-2 sentence summary that captures the key purpose and content of the page. Return ONLY the summary text, no quotes or labels.`;
export async function generateSummary(markdown, provider) {
    const truncated = markdown.slice(0, 4000); // limit to avoid token overflow
    const result = await provider.complete(truncated, SYSTEM_PROMPT);
    return result.trim();
}
//# sourceMappingURL=summarize.js.map