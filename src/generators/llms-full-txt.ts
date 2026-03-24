import type { Payload } from 'payload'

/**
 * Generate comprehensive llms-full.txt with ALL synced entries.
 */
export async function generateLlmsFullTxt(params: {
  payload: Payload
  siteUrl: string
  siteName: string
  siteDescription: string
}): Promise<string> {
  const { payload, siteUrl, siteName, siteDescription } = params

  // Query ALL synced non-aggregate entries (including drafts if in include-drafts mode)
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
  const grouped: Record<string, Array<{ title: string; url: string; description: string; isDraft: boolean }>> = {}

  for (const entry of entries) {
    const collection = (entry as any).sourceCollection as string
    const slug = (entry as any).slug as string
    const title = (entry as any).title as string
    const aiMeta = (entry as any).aiMeta as any
    const isDraft = Boolean((entry as any).isDraft)

    if (!grouped[collection]) grouped[collection] = []

    grouped[collection].push({
      title,
      url: `${siteUrl}/ai/${collection}/${slug}.md`,
      description: aiMeta?.summary || title,
      isDraft,
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
  lines.push(`> This is the comprehensive listing of all content. See /llms.txt for a curated overview.`)
  lines.push('')

  for (const [collection, items] of Object.entries(grouped)) {
    const label = collection.charAt(0).toUpperCase() + collection.slice(1)
    lines.push(`## ${label}`)
    for (const item of items) {
      const draftTag = item.isDraft ? ' [DRAFT]' : ''
      lines.push(`- [${item.title}](${item.url}): ${item.description}${draftTag}`)
    }
    lines.push('')
  }

  return lines.join('\n').trim()
}
