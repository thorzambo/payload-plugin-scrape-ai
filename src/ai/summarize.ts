import type { IAiProvider } from '../types'

const SYSTEM_PROMPT = `You are a content summarizer. Given a markdown document, produce a concise 1-2 sentence summary that captures the key purpose and content of the page. Return ONLY the summary text, no quotes or labels.`

export async function generateSummary(
  markdown: string,
  provider: IAiProvider,
): Promise<string> {
  const truncated = markdown.slice(0, 4000) // limit to avoid token overflow
  const result = await provider.complete(truncated, SYSTEM_PROMPT)

  // Validate output
  if (!result || result.length < 10) return ''
  if (result.trim().startsWith('{') || result.trim().startsWith('[')) return ''
  return result.trim().slice(0, 500)
}
