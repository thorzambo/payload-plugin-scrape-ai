import type { CollectionConfig, Field, Payload } from 'payload'

/**
 * Resolve a URL that may be relative to an absolute URL.
 * If siteUrl is provided and the URL is a relative path (starts with /),
 * prepend the siteUrl to make it absolute.
 */
function resolveUrl(url: string, siteUrl?: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (siteUrl && url.startsWith('/')) return `${siteUrl}${url}`
  return url
}

/**
 * Stage 1: Extract document content into clean markdown.
 * Traverses all fields recursively, converting each type to markdown.
 */
export function extractDocument(
  doc: Record<string, unknown>,
  collectionConfig: CollectionConfig,
  payload: Payload,
  siteUrl?: string,
): string {
  const parts: string[] = []
  const fields = collectionConfig.fields || []
  const skipFields = new Set(['id', 'createdAt', 'updatedAt', '_status', '__v'])

  for (const field of fields) {
    const fieldParts = extractField(field, doc, skipFields, payload, 1, siteUrl)
    if (fieldParts) {
      parts.push(fieldParts)
    }
  }

  return parts.filter(Boolean).join('\n\n')
}

function extractField(
  field: Field,
  doc: Record<string, unknown>,
  skipFields: Set<string>,
  payload: Payload,
  depth: number,
  siteUrl?: string,
): string | null {
  // Skip UI-only and unnamed fields
  if (!('name' in field) && !('type' in field)) return null
  if ('type' in field && field.type === 'ui') return null

  // Handle layout fields that don't have names
  if ('type' in field) {
    if (field.type === 'row' || field.type === 'collapsible') {
      if ('fields' in field && Array.isArray(field.fields)) {
        return extractFieldGroup(field.fields, doc, skipFields, payload, depth, siteUrl)
      }
      return null
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      const tabParts: string[] = []
      for (const tab of (field as any).tabs) {
        if (tab.label && tab.fields) {
          const heading = '#'.repeat(Math.min(depth + 1, 6))
          const content = extractFieldGroup(tab.fields, doc, skipFields, payload, depth + 1, siteUrl)
          if (content) {
            tabParts.push(`${heading} ${tab.label}\n\n${content}`)
          }
        } else if (tab.fields) {
          const content = extractFieldGroup(tab.fields, doc, skipFields, payload, depth, siteUrl)
          if (content) tabParts.push(content)
        }
      }
      return tabParts.length > 0 ? tabParts.join('\n\n') : null
    }
  }

  if (!('name' in field)) return null
  const name = (field as any).name as string
  if (skipFields.has(name)) return null

  const value = doc[name]
  if (value === null || value === undefined || value === '') return null

  const fieldType = (field as any).type as string

  switch (fieldType) {
    case 'richText':
      return extractRichText(value, field, siteUrl)

    case 'text':
    case 'textarea':
    case 'email':
      return String(value)

    case 'number':
      return `**${formatFieldLabel(name)}:** ${value}`

    case 'date':
      return `**${formatFieldLabel(name)}:** ${value}`

    case 'select':
    case 'radio':
      return `**${formatFieldLabel(name)}:** ${formatSelectValue(value)}`

    case 'checkbox':
      return `**${formatFieldLabel(name)}:** ${value ? 'Yes' : 'No'}`

    case 'relationship':
    case 'upload':
      return extractRelationship(value, name)

    case 'blocks':
      return extractBlocks(value as any[], skipFields, payload, depth, siteUrl)

    case 'array':
      return extractArray(value as any[], field, skipFields, payload, depth, siteUrl)

    case 'group':
      if (typeof value === 'object' && value !== null && 'fields' in field) {
        return extractFieldGroup(
          (field as any).fields,
          value as Record<string, unknown>,
          skipFields,
          payload,
          depth,
          siteUrl,
        )
      }
      return null

    case 'json':
    case 'code':
      return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``

    case 'point':
      return null

    default:
      if (typeof value === 'string') return value
      if (typeof value === 'object') return null
      return String(value)
  }
}

function extractFieldGroup(
  fields: Field[],
  doc: Record<string, unknown>,
  skipFields: Set<string>,
  payload: Payload,
  depth: number,
  siteUrl?: string,
): string | null {
  const parts: string[] = []
  for (const field of fields) {
    const content = extractField(field, doc, skipFields, payload, depth, siteUrl)
    if (content) parts.push(content)
  }
  return parts.length > 0 ? parts.join('\n\n') : null
}

function extractRichText(value: unknown, _field?: Field, siteUrl?: string): string | null {
  if (!value) return null

  // Detect Lexical vs Slate based on value structure
  if (typeof value === 'object' && value !== null) {
    // Lexical format: { root: { children: [...] } }
    if ('root' in value && typeof (value as any).root === 'object') {
      return lexicalToMarkdown((value as any).root, siteUrl)
    }

    // Slate format: array of nodes
    if (Array.isArray(value)) {
      return slateToMarkdown(value, siteUrl)
    }
  }

  // Fallback: if it's a string, return as-is
  if (typeof value === 'string') return value

  return null
}

// --- Lexical to Markdown ---

function lexicalToMarkdown(root: any, siteUrl?: string): string {
  if (!root || !root.children) return ''
  return lexicalChildrenToMarkdown(root.children, siteUrl).trim()
}

function lexicalChildrenToMarkdown(children: any[], siteUrl?: string): string {
  if (!Array.isArray(children)) return ''
  return children.map((node) => lexicalNodeToMarkdown(node, siteUrl)).filter(Boolean).join('\n\n')
}

function lexicalNodeToMarkdown(node: any, siteUrl?: string): string {
  if (!node) return ''

  switch (node.type) {
    case 'paragraph':
      return lexicalInlineChildrenToMarkdown(node.children || [], siteUrl)

    case 'heading': {
      const level = parseInt(node.tag?.replace('h', '') || '1', 10)
      const prefix = '#'.repeat(Math.min(level, 6))
      const text = lexicalInlineChildrenToMarkdown(node.children || [], siteUrl)
      return `${prefix} ${text}`
    }

    case 'list': {
      const items = (node.children || [])
        .map((item: any, i: number) => {
          const text = lexicalInlineChildrenToMarkdown(item.children || [], siteUrl)
          const prefix = node.listType === 'number' ? `${i + 1}.` : '-'
          return `${prefix} ${text}`
        })
        .join('\n')
      return items
    }

    case 'listitem':
      return lexicalInlineChildrenToMarkdown(node.children || [], siteUrl)

    case 'quote': {
      const text = lexicalInlineChildrenToMarkdown(node.children || [], siteUrl)
      return text
        .split('\n')
        .map((line: string) => `> ${line}`)
        .join('\n')
    }

    case 'code': {
      const text = lexicalInlineChildrenToMarkdown(node.children || [], siteUrl)
      const language = node.language || ''
      return `\`\`\`${language}\n${text}\n\`\`\``
    }

    case 'horizontalrule':
      return '---'

    case 'link': {
      const text = lexicalInlineChildrenToMarkdown(node.children || [], siteUrl)
      const url = resolveUrl(node.fields?.url || node.url || '#', siteUrl)
      return `[${text}](${url})`
    }

    case 'image': {
      const alt = node.altText || node.alt || ''
      const src = resolveUrl(node.src || '', siteUrl)
      return `![${alt}](${src})`
    }

    case 'upload': {
      const alt = node.value?.alt || node.value?.filename || ''
      const src = resolveUrl(node.value?.url || '', siteUrl)
      return `![${alt}](${src})`
    }

    case 'table': {
      return lexicalTableToMarkdown(node, siteUrl)
    }

    case 'linebreak':
      return '\n'

    default:
      // Recurse into children for unknown container nodes
      if (node.children && Array.isArray(node.children)) {
        return lexicalChildrenToMarkdown(node.children, siteUrl)
      }
      // Text node
      if (node.text !== undefined) {
        return formatLexicalText(node)
      }
      return ''
  }
}

function lexicalInlineChildrenToMarkdown(children: any[], siteUrl?: string): string {
  if (!Array.isArray(children)) return ''
  return children
    .map((child) => {
      if (child.text !== undefined) return formatLexicalText(child)
      return lexicalNodeToMarkdown(child, siteUrl)
    })
    .join('')
}

function formatLexicalText(node: any): string {
  let text = node.text || ''
  if (!text) return ''

  const format = node.format || 0
  // Lexical format flags: bold=1, italic=2, strikethrough=4, underline=8, code=16
  if (format & 16) text = `\`${text}\``
  if (format & 1) text = `**${text}**`
  if (format & 2) text = `*${text}*`
  if (format & 4) text = `~~${text}~~`

  return text
}

function lexicalTableToMarkdown(node: any, siteUrl?: string): string {
  if (!node.children || !Array.isArray(node.children)) return ''

  const rows: string[][] = []
  for (const row of node.children) {
    if (!row.children) continue
    const cells: string[] = []
    for (const cell of row.children) {
      cells.push(lexicalInlineChildrenToMarkdown(cell.children || [], siteUrl))
    }
    rows.push(cells)
  }

  if (rows.length === 0) return ''

  const maxCols = Math.max(...rows.map((r) => r.length))
  const lines: string[] = []

  // Header row
  lines.push('| ' + (rows[0] || []).map((c) => c || '').join(' | ') + ' |')
  lines.push('| ' + Array(maxCols).fill('---').join(' | ') + ' |')

  // Data rows
  for (let i = 1; i < rows.length; i++) {
    lines.push('| ' + rows[i].map((c) => c || '').join(' | ') + ' |')
  }

  return lines.join('\n')
}

// --- Slate to Markdown ---

function slateToMarkdown(nodes: any[], siteUrl?: string): string {
  if (!Array.isArray(nodes)) return ''
  return nodes.map((node) => slateNodeToMarkdown(node, siteUrl)).filter(Boolean).join('\n\n')
}

function slateNodeToMarkdown(node: any, siteUrl?: string): string {
  if (!node) return ''

  // Text leaf node
  if (node.text !== undefined) {
    return formatSlateText(node)
  }

  const children = node.children || []
  const childText = slateInlineToMarkdown(children, siteUrl)

  switch (node.type) {
    case 'h1':
      return `# ${childText}`
    case 'h2':
      return `## ${childText}`
    case 'h3':
      return `### ${childText}`
    case 'h4':
      return `#### ${childText}`
    case 'h5':
      return `##### ${childText}`
    case 'h6':
      return `###### ${childText}`
    case 'blockquote':
      return childText
        .split('\n')
        .map((l: string) => `> ${l}`)
        .join('\n')
    case 'ul':
      return children
        .map((item: any) => `- ${slateInlineToMarkdown(item.children || [], siteUrl)}`)
        .join('\n')
    case 'ol':
      return children
        .map(
          (item: any, i: number) =>
            `${i + 1}. ${slateInlineToMarkdown(item.children || [], siteUrl)}`,
        )
        .join('\n')
    case 'li':
      return slateInlineToMarkdown(children, siteUrl)
    case 'link': {
      const url = resolveUrl(node.url || '#', siteUrl)
      return `[${childText}](${url})`
    }
    case 'upload':
    case 'image': {
      const alt = node.alt || node.value?.alt || ''
      const src = resolveUrl(node.url || node.value?.url || '', siteUrl)
      return `![${alt}](${src})`
    }
    case 'code':
      return `\`\`\`\n${childText}\n\`\`\``

    case 'table': {
      if (!children || children.length === 0) return ''
      const rows: string[][] = []
      for (const row of children) {
        const cells: string[] = (row.children || []).map((cell: any) =>
          slateInlineToMarkdown(cell.children || [], siteUrl)
        )
        rows.push(cells)
      }
      if (rows.length === 0) return ''
      const maxCols = Math.max(...rows.map(r => r.length))
      const lines: string[] = []
      lines.push('| ' + (rows[0] || []).map(c => c || '').join(' | ') + ' |')
      lines.push('| ' + Array(maxCols).fill('---').join(' | ') + ' |')
      for (let i = 1; i < rows.length; i++) {
        lines.push('| ' + rows[i].map(c => c || '').join(' | ') + ' |')
      }
      return lines.join('\n')
    }

    default:
      return childText
  }
}

function slateInlineToMarkdown(children: any[], siteUrl?: string): string {
  if (!Array.isArray(children)) return ''
  return children
    .map((child) => {
      if (child.text !== undefined) return formatSlateText(child)
      return slateNodeToMarkdown(child, siteUrl)
    })
    .join('')
}

function formatSlateText(node: any): string {
  let text = node.text || ''
  if (!text) return ''

  if (node.code) text = `\`${text}\``
  if (node.bold) text = `**${text}**`
  if (node.italic) text = `*${text}*`
  if (node.strikethrough) text = `~~${text}~~`

  return text
}

// --- Helpers ---

function extractRelationship(value: unknown, fieldName: string): string | null {
  if (!value) return null

  // Single relation (populated object)
  if (typeof value === 'object' && !Array.isArray(value)) {
    const rel = value as Record<string, unknown>
    const title = (rel.title || rel.name || rel.id || '') as string
    return title ? `**${formatFieldLabel(fieldName)}:** ${title}` : null
  }

  // HasMany relation (array)
  if (Array.isArray(value)) {
    const items = value
      .map((v) => {
        if (typeof v === 'object' && v !== null) {
          return (v as any).title || (v as any).name || (v as any).id || ''
        }
        return String(v)
      })
      .filter(Boolean)
    if (items.length === 0) return null
    return `**${formatFieldLabel(fieldName)}:** ${items.join(', ')}`
  }

  // ID reference (string)
  return `**${formatFieldLabel(fieldName)}:** ${value}`
}

function extractBlocks(
  blocks: any[],
  skipFields: Set<string>,
  payload: Payload,
  depth: number,
  siteUrl?: string,
): string | null {
  if (!Array.isArray(blocks) || blocks.length === 0) return null

  const parts: string[] = []
  for (const block of blocks) {
    const blockType = block.blockType || block.type || 'block'
    const heading = '#'.repeat(Math.min(depth + 1, 6))
    const blockParts: string[] = [`${heading} ${formatFieldLabel(blockType)}`]

    for (const [key, val] of Object.entries(block)) {
      if (key === 'blockType' || key === 'type' || key === 'id' || key === 'blockName') continue
      if (val === null || val === undefined || val === '') continue

      if (typeof val === 'string') {
        blockParts.push(val)
      } else if (typeof val === 'number' || typeof val === 'boolean') {
        blockParts.push(`**${formatFieldLabel(key)}:** ${val}`)
      } else if (Array.isArray(val)) {
        const arrayContent = val
          .map((item) => {
            if (typeof item === 'string') return item
            if (typeof item === 'object' && item !== null) {
              const richText = extractRichText(item, undefined, siteUrl)
              if (richText) return richText
              const texts: string[] = []
              for (const [k, v] of Object.entries(item)) {
                if (typeof v === 'string' && v && k !== 'id' && k !== 'blockType') texts.push(v)
                if (typeof v === 'number' || typeof v === 'boolean') texts.push(`**${formatFieldLabel(k)}:** ${v}`)
              }
              return texts.join('\n')
            }
            return String(item)
          })
          .filter(Boolean)
        if (arrayContent.length > 0) blockParts.push(arrayContent.join('\n'))
      } else if (typeof val === 'object') {
        const richText = extractRichText(val, undefined, siteUrl)
        if (richText) blockParts.push(richText)
      }
    }

    if (blockParts.length > 1) {
      parts.push(blockParts.join('\n\n'))
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : null
}

function extractArray(
  items: any[],
  field: Field,
  skipFields: Set<string>,
  payload: Payload,
  depth: number,
  siteUrl?: string,
): string | null {
  if (!Array.isArray(items) || items.length === 0) return null
  if (!('fields' in field)) return null

  const parts: string[] = []
  for (const item of items) {
    const content = extractFieldGroup(
      (field as any).fields,
      item as Record<string, unknown>,
      skipFields,
      payload,
      depth + 1,
      siteUrl,
    )
    if (content) parts.push(content)
  }

  return parts.length > 0 ? parts.join('\n\n---\n\n') : null
}

function formatFieldLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

function formatSelectValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}
