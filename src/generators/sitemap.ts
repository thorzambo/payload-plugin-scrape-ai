import type { Payload } from 'payload'

/**
 * Generate the AI sitemap JSON with content relationships and hierarchy.
 */
export async function generateAiSitemap(params: {
  payload: Payload
  siteUrl: string
  siteName: string
}): Promise<Record<string, unknown>> {
  const { payload, siteUrl, siteName } = params

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
  const collections: Record<string, { count: number; entries: any[] }> = {}

  // Build hierarchy map
  const hierarchy: Record<string, { children: string[]; url: string }> = {}

  for (const entry of entries) {
    const collection = (entry as any).sourceCollection as string
    const slug = (entry as any).slug as string
    const title = (entry as any).title as string
    const parentSlug = (entry as any).parentSlug as string | undefined
    const relatedSlugs = ((entry as any).relatedSlugs || []) as string[]
    const aiMeta = (entry as any).aiMeta as any
    const lastSynced = (entry as any).lastSynced as string
    const jsonLd = (entry as any).jsonLd as any

    if (!collections[collection]) {
      collections[collection] = { count: 0, entries: [] }
    }

    collections[collection].count++
    collections[collection].entries.push({
      title,
      slug,
      url: `/ai/${collection}/${slug}.md`,
      canonicalUrl: ((entry as any).canonicalUrl as string) || `${siteUrl}/${slug}`,
      parent: parentSlug || null,
      children: [], // populated below
      relatedTo: relatedSlugs,
      topics: aiMeta?.topics || [],
      lastModified: lastSynced,
      contentType: jsonLd?.['@type'] || 'CreativeWork',
    })

    // Build hierarchy
    if (parentSlug) {
      if (!hierarchy[parentSlug]) {
        hierarchy[parentSlug] = { children: [], url: `/ai/${collection}/${parentSlug}.md` }
      }
      hierarchy[parentSlug].children.push(slug)
    }
  }

  // Populate children in entries
  for (const [, collectionData] of Object.entries(collections)) {
    for (const entry of collectionData.entries) {
      const h = hierarchy[entry.slug]
      if (h) {
        entry.children = h.children
      }
    }
  }

  return {
    siteName,
    siteUrl,
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    collections,
    hierarchy,
  }
}
