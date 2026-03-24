import type { CollectionConfig } from 'payload'
import type { TransformResult, AiContentDoc } from '../types'
import { generateJsonLd } from '../generators/json-ld'

/**
 * Stage 2: Add frontmatter, hierarchy, relationships, and JSON-LD to extracted markdown.
 */
export function structureContent(params: {
  markdown: string
  doc: Record<string, unknown>
  collectionSlug: string
  collectionConfig: CollectionConfig
  siteUrl: string
  siteName: string
  locale?: string
  allContent?: Pick<AiContentDoc, 'slug' | 'sourceCollection' | 'title' | 'parentSlug'>[]
}): TransformResult {
  const { markdown, doc, collectionSlug, collectionConfig, siteUrl, siteName, locale, allContent } = params

  // Extract title
  const title = extractTitle(doc)

  // Extract slug
  const originalSlug = extractSlug(doc)
  const urlSlug = toUrlSlug(originalSlug)

  // Determine draft status
  const isDraft = doc._status === 'draft'

  // Detect parent from slug pattern
  const parentSlug = inferParent(originalSlug)

  // Find children if allContent provided
  const children = allContent
    ? allContent
        .filter(
          (c) =>
            c.sourceCollection === collectionSlug &&
            c.slug !== urlSlug &&
            c.parentSlug === urlSlug,
        )
        .map((c) => c.slug)
    : []

  // Extract related slugs from relationship fields
  const relatedSlugs = extractRelatedSlugs(doc, collectionConfig)

  // Generate JSON-LD
  const lastModified = (doc.updatedAt || doc.createdAt || new Date().toISOString()) as string
  const jsonLd = generateJsonLd({
    title,
    slug: originalSlug,
    collection: collectionSlug,
    siteUrl,
    siteName,
    lastModified,
  })

  // Build frontmatter
  const frontmatter: Record<string, unknown> = {
    title,
    slug: originalSlug,
    collection: collectionSlug,
    canonicalUrl: `${siteUrl}/${originalSlug}`,
    lastModified,
    contentType: jsonLd['@type'] || 'CreativeWork',
  }

  if (parentSlug) frontmatter.parent = parentSlug
  frontmatter.children = children
  if (locale) frontmatter.locale = locale
  if (isDraft) frontmatter.draft = true

  // Build the full markdown with frontmatter
  const frontmatterYaml = buildFrontmatter(frontmatter)

  // Build related content section
  const relatedSection = buildRelatedSection(relatedSlugs, collectionSlug, siteUrl)

  const fullMarkdown = [
    frontmatterYaml,
    `# ${title}`,
    markdown,
    relatedSection,
  ]
    .filter(Boolean)
    .join('\n\n')

  return {
    markdown: fullMarkdown,
    title,
    slug: urlSlug,
    urlSlug,
    canonicalUrl: `${siteUrl}/${originalSlug}`,
    parentSlug: parentSlug ? toUrlSlug(parentSlug) : undefined,
    relatedSlugs,
    jsonLd,
    isDraft,
    locale,
  }
}

// --- Helpers ---

function extractTitle(doc: Record<string, unknown>): string {
  for (const key of ['title', 'name', 'label', 'heading']) {
    if (typeof doc[key] === 'string' && doc[key]) {
      return doc[key] as string
    }
  }
  return String(doc.id || 'Untitled')
}

function extractSlug(doc: Record<string, unknown>): string {
  for (const key of ['slug', 'path', 'uri']) {
    if (typeof doc[key] === 'string' && doc[key]) {
      return (doc[key] as string).replace(/^\//, '') // strip leading slash
    }
  }
  return String(doc.id || 'unknown')
}

export function toUrlSlug(slug: string): string {
  return slug.replace(/\//g, '-')
}

export function inferParent(slug: string): string | undefined {
  const parts = slug.split('/')
  if (parts.length <= 1) return undefined
  return parts.slice(0, -1).join('/')
}

function extractRelatedSlugs(
  doc: Record<string, unknown>,
  collectionConfig: CollectionConfig,
): string[] {
  const related: string[] = []

  for (const field of collectionConfig.fields || []) {
    if (!('name' in field) || !('type' in field)) continue
    const fieldType = (field as any).type

    if (fieldType === 'relationship' || fieldType === 'upload') {
      const value = doc[(field as any).name]
      if (!value) continue

      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            const slug = (item as any).slug || (item as any).path
            if (slug) related.push(toUrlSlug(slug))
          }
        }
      } else if (typeof value === 'object') {
        const slug = (value as any).slug || (value as any).path
        if (slug) related.push(toUrlSlug(slug))
      }
    }
  }

  return related
}

function buildFrontmatter(data: Record<string, unknown>): string {
  const lines: string[] = ['---']
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`)
      } else {
        lines.push(`${key}:`)
        for (const item of value) {
          lines.push(`  - "${item}"`)
        }
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`)
    } else {
      const escaped = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      lines.push(`${key}: "${escaped}"`)
    }
  }
  lines.push('---')
  return lines.join('\n')
}

function buildRelatedSection(
  relatedSlugs: string[],
  collectionSlug: string,
  siteUrl: string,
): string {
  if (relatedSlugs.length === 0) return ''

  const links = relatedSlugs
    .map((slug) => `- [${slug}](${siteUrl}/ai/${collectionSlug}/${slug}.md)`)
    .join('\n')

  return `## Related Content\n${links}`
}
