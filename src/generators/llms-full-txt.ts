import type { Payload } from 'payload'

/**
 * Generate comprehensive llms-full.txt with ALL synced entries.
 * Includes inline content excerpts so agents can get meaningful
 * content in a single request without hopping to each .md file.
 */
export async function generateLlmsFullTxt(params: {
  payload: Payload
  siteUrl: string
  siteName: string
  siteDescription: string
}): Promise<string> {
  const { payload, siteUrl, siteName, siteDescription } = params

  const allContent = await payload.find({
    collection: 'ai-content',
    where: {
      sourceCollection: { not_equals: '__aggregate' },
      status: { equals: 'synced' },
    },
    limit: 10000,
    sort: 'sourceCollection',
  })

  const entries = allContent.docs

  // Group by collection
  const grouped: Record<string, Array<{
    title: string
    url: string
    description: string
    excerpt: string
    isDraft: boolean
    topics: string[]
  }>> = {}

  for (const entry of entries) {
    const collection = (entry as any).sourceCollection as string
    const slug = (entry as any).slug as string
    const title = (entry as any).title as string
    const markdown = (entry as any).markdown as string || ''
    const aiMeta = (entry as any).aiMeta as any
    const isDraft = Boolean((entry as any).isDraft)

    if (!grouped[collection]) grouped[collection] = []

    // Extract clean excerpt: strip frontmatter, take first 500 chars
    const cleanContent = markdown.replace(/^---[\s\S]*?---\n*/m, '').trim()
    const excerpt = cleanContent.slice(0, 500).trim()

    grouped[collection].push({
      title,
      url: `${siteUrl}/ai/${collection}/${slug}.md`,
      description: aiMeta?.summary || title,
      excerpt,
      isDraft,
      topics: aiMeta?.topics || [],
    })
  }

  // Build output
  const lines: string[] = []
  lines.push(`# ${siteName}`)
  lines.push('')
  if (siteDescription) {
    lines.push(`> ${siteDescription}`)
    lines.push('')
  }
  lines.push(`> Comprehensive listing of all ${entries.length} content entries with inline excerpts.`)
  lines.push(`> For a curated overview, see [/llms.txt](${siteUrl}/llms.txt).`)
  lines.push(`> For structured data, see [/ai/sitemap.json](${siteUrl}/ai/sitemap.json).`)
  lines.push('')

  for (const [collection, items] of Object.entries(grouped)) {
    const label = collection.charAt(0).toUpperCase() + collection.slice(1)
    lines.push(`## ${label}`)
    lines.push('')

    for (const item of items) {
      const draftTag = item.isDraft ? ' [DRAFT]' : ''
      const topicsStr = item.topics.length > 0 ? ` | Topics: ${item.topics.join(', ')}` : ''
      lines.push(`### [${item.title}](${item.url})${draftTag}`)
      if (item.description !== item.title) {
        lines.push(`> ${item.description}${topicsStr}`)
      }
      lines.push('')
      if (item.excerpt) {
        lines.push(item.excerpt)
        if (item.excerpt.length >= 500) {
          lines.push(`\n[... read full content](${item.url})`)
        }
      }
      lines.push('')
    }
  }

  return lines.join('\n').trim()
}
