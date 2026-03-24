import type { CollectionConfig, Config, Field } from 'payload'
import type { ScrapeAiPluginOptions } from '../types'

/**
 * Detect content collections by analyzing field signatures.
 * A collection is considered "content" if it has 2+ of these signals:
 * - A richText field
 * - A text field named 'title' or 'name'
 * - A text field named 'slug' or 'path'
 */
export function detectContentCollections(
  config: Config,
  options: ScrapeAiPluginOptions,
): string[] {
  const collections = config.collections || []

  // If explicit collections provided, use those minus excludes
  if (options.collections && options.collections.length > 0) {
    const excludeSet = new Set(options.exclude || [])
    return options.collections.filter((slug) => !excludeSet.has(slug))
  }

  // Smart detection
  const excludeSet = new Set(options.exclude || [])
  const pluginCollections = new Set(['ai-content', 'ai-sync-queue'])
  const detected: string[] = []

  for (const collection of collections) {
    if (excludeSet.has(collection.slug)) continue
    if (pluginCollections.has(collection.slug)) continue

    const score = scoreCollection(collection)
    if (score >= 2) {
      detected.push(collection.slug)
    }
  }

  return detected
}

function scoreCollection(collection: CollectionConfig): number {
  let score = 0
  const fields = flattenFields(collection.fields || [])

  for (const field of fields) {
    if (!('type' in field)) continue

    if (field.type === 'richText') {
      score++
      continue
    }

    if (field.type === 'text' && 'name' in field) {
      const name = field.name.toLowerCase()
      if (name === 'title' || name === 'name') {
        score++
      } else if (name === 'slug' || name === 'path') {
        score++
      }
    }
  }

  return score
}

/**
 * Flatten nested fields (groups, tabs, rows, collapsibles) into a flat list.
 */
function flattenFields(fields: Field[]): Field[] {
  const result: Field[] = []

  for (const field of fields) {
    result.push(field)

    if ('fields' in field && Array.isArray(field.fields)) {
      result.push(...flattenFields(field.fields))
    }

    if ('tabs' in field && Array.isArray((field as any).tabs)) {
      for (const tab of (field as any).tabs) {
        if (tab.fields) {
          result.push(...flattenFields(tab.fields))
        }
      }
    }
  }

  return result
}
