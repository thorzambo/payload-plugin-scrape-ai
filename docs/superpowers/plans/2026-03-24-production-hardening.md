# Production Hardening & Native Admin UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all security, correctness, performance, and convention issues identified in the full repo audit, and rebuild the admin UI using Payload's native components so the plugin feels fully integrated.

**Architecture:** Every fix is surgical — touch only what's needed. The admin UI is rewritten to use Payload's DefaultTemplate, Gutter, and CSS variable system instead of custom inline styles. Build pipeline switches from raw tsc to tsup for proper ESM output.

**Tech Stack:** Payload CMS v3, TypeScript, React 19, tsup

---

## File Structure

### Files to Create
- `src/admin/views/ScrapeAiView.tsx` — Rewrite: RSC with DefaultTemplate + Gutter
- `src/admin/views/DashboardClient.tsx` — New: client component with tabs (replaces Dashboard.tsx)
- `src/admin/styles.css` — New: CSS file using Payload's CSS custom properties
- `tsup.config.ts` — New: tsup build config replacing raw tsc

### Files to Modify (grouped by task)
- `src/endpoints/admin-api.ts` — Add auth guards to all GET endpoints
- `src/globals/ai-config.ts` — Remove aiApiKey field
- `src/types.ts` — Remove aiApiKey from AiConfigGlobal
- `src/ai/provider.ts` — Remove global config API key path
- `src/pipeline/extract.ts` — Fix block extraction, add Slate code/table
- `src/pipeline/structure.ts` — Fix YAML escaping, array item escaping
- `src/generators/json-ld.ts` — Fix datePublished, pass description
- `src/generators/llms-txt.ts` — Remove hard limit, add pagination
- `src/generators/llms-full-txt.ts` — Filter drafts, remove hard limit
- `src/generators/sitemap.ts` — Remove hard limit
- `src/endpoints/context-query.ts` — Fix double-scoring, add field select
- `src/endpoints/rate-limiter.ts` — Add .unref() to cleanup interval
- `src/endpoints/robots-txt.ts` — Remove fs.readFileSync, use safe fallback
- `src/endpoints/head-support.ts` — Optimize HEAD to avoid full GET execution
- `src/sync/scheduler.ts` — Fix year-rollover, add .unref(), add stop()
- `src/sync/queue-processor.ts` — Share data across generators, queue cleanup
- `src/sync/initial-sync.ts` — Defer to non-blocking
- `src/index.ts` — Wire scheduler stop, use root:true, defer initial sync
- `src/next.ts` — Remove robots.txt rewrite, simplify
- `src/admin/components/NavLink.tsx` — Use Payload nav patterns
- `package.json` — Fix peer deps, add tsup, fix exports
- `tsconfig.json` — Fix moduleResolution
- `.gitignore` — Add dist/ back

### Files to Delete
- `src/admin/views/Dashboard.tsx` — Replaced by DashboardClient.tsx
- `src/ambient.d.ts` — No longer needed with proper optional peer deps

---

### Task 1: Security — Auth Guards on Admin GET Endpoints

**Files:**
- Modify: `src/endpoints/admin-api.ts`

- [ ] **Step 1: Add auth check to every GET handler**

In `admin-api.ts`, add this guard at the top of every GET handler (status, entries, entry/:id, llms-txt-config, detected-collections, token-estimate, model-catalog):

```typescript
if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

Remove all `// Auth: GET endpoints are open (admin panel handles its own auth)` comments.

- [ ] **Step 2: Fix req.json optional chaining**

Replace all `await req.json?.() || {}` with:
```typescript
let body: any = {}
try { body = await req.json() } catch { /* empty body */ }
```

- [ ] **Step 3: Commit**
```bash
git add src/endpoints/admin-api.ts
git commit -m "fix(security): add auth guards to all admin GET endpoints"
```

---

### Task 2: Security — Remove API Key from Database

**Files:**
- Modify: `src/globals/ai-config.ts`
- Modify: `src/types.ts`
- Modify: `src/ai/provider.ts`
- Modify: `src/endpoints/admin-api.ts`

- [ ] **Step 1: Remove aiApiKey field from ai-config global**

In `ai-config.ts`, delete the entire `aiApiKey` field definition (lines 33-41).

- [ ] **Step 2: Remove aiApiKey from AiConfigGlobal type**

In `types.ts`, remove `aiApiKey?: string` from the `AiConfigGlobal` interface.

- [ ] **Step 3: Update resolveAiProvider to only use plugin config**

In `provider.ts`, the `resolveAiProvider` function should:
- Remove `globalConfig.aiApiKey` usage
- Always get the API key from `pluginAiConfig.apiKey`
- Global config only controls `aiEnabled`, `aiProvider`, `aiModel` (model override)

```typescript
export async function resolveAiProvider(
  pluginAiConfig?: AiProviderConfig,
  globalConfig?: { aiEnabled: boolean; aiProvider?: string; aiModel?: string },
): Promise<IAiProvider | null> {
  if (!pluginAiConfig?.apiKey) return null

  // Global config can override provider/model but NOT the key
  if (globalConfig?.aiEnabled) {
    return createAiProvider({
      provider: (globalConfig.aiProvider as 'openai' | 'anthropic') || pluginAiConfig.provider,
      apiKey: pluginAiConfig.apiKey,
      model: globalConfig.aiModel || pluginAiConfig.model,
    })
  }

  return createAiProvider(pluginAiConfig)
}
```

- [ ] **Step 4: Update admin-api test-ai endpoint**

Remove the line that reads API key from ai-config:
```typescript
// REMOVE: const apiKey = (aiConfig as any)?.aiApiKey || pluginOptions.ai?.apiKey
```
The test-ai endpoint should use the plugin's stored AI provider instance, not create a new one from the global config key. Or if no plugin AI config exists, return an error saying to configure `ai.apiKey` in plugin options.

- [ ] **Step 5: Update admin-api ai-settings POST**

Remove `if (body.aiApiKey) data.aiApiKey = body.aiApiKey` from the handler.

- [ ] **Step 6: Commit**
```bash
git add src/globals/ai-config.ts src/types.ts src/ai/provider.ts src/endpoints/admin-api.ts
git commit -m "fix(security): remove API key from database, require env var only"
```

---

### Task 3: Pipeline — Fix Block Extraction

**Files:**
- Modify: `src/pipeline/extract.ts`

- [ ] **Step 1: Fix extractBlocks to handle non-string primitives**

Replace the block iteration in `extractBlocks` (lines 447-457) with:

```typescript
for (const [key, val] of Object.entries(block)) {
  if (key === 'blockType' || key === 'type' || key === 'id' || key === 'blockName') continue
  if (val === null || val === undefined || val === '') continue

  if (typeof val === 'string') {
    blockParts.push(val)
  } else if (typeof val === 'number' || typeof val === 'boolean') {
    blockParts.push(`**${formatFieldLabel(key)}:** ${val}`)
  } else if (Array.isArray(val)) {
    // Could be an array of blocks or items
    const arrayContent = val
      .map((item) => {
        if (typeof item === 'string') return item
        if (typeof item === 'object' && item !== null) {
          const richText = extractRichText(item, {} as Field)
          if (richText) return richText
          // Try to extract text fields from the item
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
    const richText = extractRichText(val, {} as Field)
    if (richText) blockParts.push(richText)
  }
}
```

- [ ] **Step 2: Add Slate code block and table handling**

In `slateNodeToMarkdown`, add cases before the `default`:

```typescript
case 'code':
  return `\`\`\`\n${childText}\n\`\`\``

case 'table': {
  if (!children || children.length === 0) return ''
  const rows: string[][] = []
  for (const row of children) {
    const cells: string[] = (row.children || []).map((cell: any) =>
      slateInlineToMarkdown(cell.children || [])
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
```

- [ ] **Step 3: Commit**
```bash
git add src/pipeline/extract.ts
git commit -m "fix(pipeline): handle non-string block values, add Slate code/table support"
```

---

### Task 4: Pipeline — Fix YAML Frontmatter Escaping

**Files:**
- Modify: `src/pipeline/structure.ts`

- [ ] **Step 1: Fix buildFrontmatter escaping**

Replace the `buildFrontmatter` function:

```typescript
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
          lines.push(`  - "${escapeYamlString(String(item))}"`)
        }
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`)
    } else {
      lines.push(`${key}: "${escapeYamlString(String(value))}"`)
    }
  }
  lines.push('---')
  return lines.join('\n')
}

function escapeYamlString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}
```

- [ ] **Step 2: Pass description to generateJsonLd**

In `structureContent`, update the `generateJsonLd` call to pass description:

```typescript
const description = extractDescription(doc)
const jsonLd = generateJsonLd({
  title,
  slug: originalSlug,
  collection: collectionSlug,
  siteUrl,
  siteName,
  description,
  lastModified,
  createdAt: (doc.createdAt || new Date().toISOString()) as string,
})
```

Add `extractDescription` helper:
```typescript
function extractDescription(doc: Record<string, unknown>): string | undefined {
  for (const key of ['description', 'excerpt', 'summary', 'meta.description']) {
    const val = key.includes('.') ? (doc[key.split('.')[0]] as any)?.[key.split('.')[1]] : doc[key]
    if (typeof val === 'string' && val) return val
  }
  return undefined
}
```

- [ ] **Step 3: Commit**
```bash
git add src/pipeline/structure.ts
git commit -m "fix(pipeline): proper YAML escaping for newlines/arrays, pass description to JSON-LD"
```

---

### Task 5: Fix JSON-LD datePublished

**Files:**
- Modify: `src/generators/json-ld.ts`

- [ ] **Step 1: Add createdAt parameter and fix datePublished**

Update the function signature and body:

```typescript
export function generateJsonLd(params: {
  title: string
  slug: string
  collection: string
  siteUrl: string
  siteName: string
  description?: string
  lastModified?: string
  createdAt?: string
  contentType?: string
}): Record<string, unknown> {
  const { title, slug, collection, siteUrl, siteName, description, lastModified, createdAt } = params
  // ...existing code...

  // In the Article/BlogPosting case:
  switch (schemaType) {
    case 'Article':
    case 'BlogPosting':
      jsonLd.datePublished = createdAt || lastModified
      jsonLd.headline = title
      break
  }
```

- [ ] **Step 2: Commit**
```bash
git add src/generators/json-ld.ts
git commit -m "fix(json-ld): use createdAt for datePublished instead of lastModified"
```

---

### Task 6: Fix Generator Hard Limits

**Files:**
- Modify: `src/generators/llms-txt.ts`
- Modify: `src/generators/llms-full-txt.ts`
- Modify: `src/generators/sitemap.ts`

- [ ] **Step 1: Add pagination to all generators**

Replace `limit: 1000` / `limit: 10000` with a paginated fetch helper:

Add to each generator file (or create a shared helper):
```typescript
async function fetchAllContent(
  payload: Payload,
  where: Record<string, any>,
  sort?: string,
): Promise<any[]> {
  const allDocs: any[] = []
  let page = 1
  let hasMore = true
  while (hasMore) {
    const result = await payload.find({
      collection: 'ai-content',
      where,
      limit: 500,
      page,
      sort: sort || 'title',
    })
    allDocs.push(...result.docs)
    hasMore = result.hasNextPage
    page++
  }
  return allDocs
}
```

Use this in `generateLlmsTxt`, `generateLlmsFullTxt`, and `generateAiSitemap` instead of single `payload.find` calls with high limits.

- [ ] **Step 2: Filter drafts from llms-full.txt**

In `generateLlmsFullTxt`, add `isDraft: { equals: false }` to the where clause (matching llms-txt behavior):

```typescript
const where = {
  sourceCollection: { not_equals: '__aggregate' },
  status: { equals: 'synced' },
  isDraft: { equals: false },
}
```

- [ ] **Step 3: Commit**
```bash
git add src/generators/llms-txt.ts src/generators/llms-full-txt.ts src/generators/sitemap.ts
git commit -m "fix(generators): paginate all queries, filter drafts from llms-full.txt"
```

---

### Task 7: Fix Context Query Double-Scoring and Memory

**Files:**
- Modify: `src/endpoints/context-query.ts`

- [ ] **Step 1: Remove duplicate summary scoring**

Remove the second summary check (lines 92-95). The scoring should be:
- Title: 3x
- Slug: 2x
- Summary: 2x (single check)
- Topic: 4x
- Entity: 3x

Update `maxPossibleScore` to `3 + 2 + 2 + 4 + 3` = 14.

- [ ] **Step 2: Add field select to reduce memory**

Add a `select` property to the Payload find call to avoid loading full markdown:

```typescript
const allContent = await payload.find({
  collection: 'ai-content',
  where: whereClause,
  limit: 1000,
  select: {
    title: true,
    slug: true,
    sourceCollection: true,
    canonicalUrl: true,
    aiMeta: true,
  },
})
```

Note: If Payload v3's `find` doesn't support `select`, use `depth: 0` and accept that markdown loads. Add a comment documenting why.

- [ ] **Step 3: Commit**
```bash
git add src/endpoints/context-query.ts
git commit -m "fix(context-query): remove duplicate scoring, reduce memory with field select"
```

---

### Task 8: Fix Scheduler Bugs

**Files:**
- Modify: `src/sync/scheduler.ts`

- [ ] **Step 1: Fix year-rollover bug in monthly reset**

Replace the month comparison:
```typescript
// Before (broken):
if (!resetDate || new Date(resetDate).getMonth() !== now.getMonth())

// After (correct):
const resetDateObj = resetDate ? new Date(resetDate) : null
const needsReset = !resetDateObj ||
  resetDateObj.getMonth() !== now.getMonth() ||
  resetDateObj.getFullYear() !== now.getFullYear()

if (needsReset) {
```

- [ ] **Step 2: Add .unref() to resetInterval and return stop function**

Refactor `startScheduler` to return a cleanup function:

```typescript
export function startScheduler(
  payload: Payload,
  pluginOptions: ResolvedPluginConfig,
  aiProvider: IAiProvider | null,
): () => void {
  // ...existing interval setup...
  // Ensure ALL intervals have .unref()

  return () => {
    clearInterval(queueInterval)
    clearInterval(recoveryInterval)
    clearInterval(resetInterval)
  }
}
```

- [ ] **Step 3: Commit**
```bash
git add src/sync/scheduler.ts
git commit -m "fix(scheduler): year-rollover bug, .unref() on all intervals, add stop()"
```

---

### Task 9: Fix Rate Limiter Leak

**Files:**
- Modify: `src/endpoints/rate-limiter.ts`

- [ ] **Step 1: Add .unref() and destroy method**

```typescript
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private maxPerMinute: number
  private cleanupTimer: ReturnType<typeof setInterval>

  constructor(maxPerMinute: number) {
    this.maxPerMinute = maxPerMinute
    this.cleanupTimer = setInterval(() => this.cleanup(), 60000)
    this.cleanupTimer.unref()
  }

  destroy(): void {
    clearInterval(this.cleanupTimer)
    this.requests.clear()
  }
  // ...rest unchanged
}
```

- [ ] **Step 2: Commit**
```bash
git add src/endpoints/rate-limiter.ts
git commit -m "fix(rate-limiter): add .unref() to cleanup interval, add destroy()"
```

---

### Task 10: Fix robots.txt fs.readFileSync

**Files:**
- Modify: `src/endpoints/robots-txt.ts`

- [ ] **Step 1: Remove fs dependency, serve only AI block**

The merged robots.txt endpoint should NOT try to read the filesystem. Instead, remove `createMergedRobotsTxtEndpoint` entirely. The `withScrapeAi` Next.js wrapper already handles the rewrite — but robots.txt merging should be the user's responsibility.

Replace with a simpler approach: keep only `createRobotsTxtEndpoint` which returns the AI discovery block. Remove the `createMergedRobotsTxtEndpoint` and the `fs`/`path` imports.

Update `src/index.ts` to remove `createMergedRobotsTxtEndpoint` from the endpoints array.

Update `src/next.ts` to remove the `/robots.txt` rewrite.

- [ ] **Step 2: Commit**
```bash
git add src/endpoints/robots-txt.ts src/index.ts src/next.ts
git commit -m "fix(robots-txt): remove fs.readFileSync, serve AI block only"
```

---

### Task 11: Optimize HEAD Handler

**Files:**
- Modify: `src/endpoints/head-support.ts`

- [ ] **Step 1: Return cached static headers for HEAD**

For most endpoints, HEAD can return standard headers without executing the full handler:

```typescript
export function withHeadSupport(endpointConfig: Endpoint): Endpoint[] {
  return [
    endpointConfig,
    {
      path: endpointConfig.path,
      method: 'head' as const,
      handler: async (req: PayloadRequest): Promise<Response> => {
        // Return lightweight response with common headers
        // Avoid executing the full GET handler for HEAD requests
        return new Response(null, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=60',
            'Access-Control-Allow-Origin': '*',
          },
        })
      },
    },
  ]
}
```

- [ ] **Step 2: Commit**
```bash
git add src/endpoints/head-support.ts
git commit -m "perf(head): return static headers without executing full GET handler"
```

---

### Task 12: Queue Processor — Share Data, Cleanup Jobs

**Files:**
- Modify: `src/sync/queue-processor.ts`

- [ ] **Step 1: Share content data across generators in processRebuildJobs**

Fetch ai-content once, pass to all generators:

```typescript
// Fetch all synced content once
const allContent = await fetchAllContent(payload, {
  sourceCollection: { not_equals: '__aggregate' },
  status: { equals: 'synced' },
})

const [llmsTxt, llmsFullTxt, sitemap] = await Promise.all([
  generateLlmsTxt({ ...params, entries: allContent }),
  generateLlmsFullTxt({ ...params, entries: allContent }),
  generateAiSitemap({ ...params, entries: allContent }),
])
```

Update each generator to accept an optional `entries` parameter to skip their own DB query.

- [ ] **Step 2: Add completed job cleanup**

At the end of `processQueue`, add:

```typescript
// Cleanup completed jobs older than 24 hours
const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
const oldJobs = await payload.find({
  collection: 'ai-sync-queue',
  where: {
    status: { in: ['completed', 'failed'] },
    createdAt: { less_than: cutoff },
  },
  limit: 100,
})
for (const job of oldJobs.docs) {
  await payload.delete({ collection: 'ai-sync-queue', id: job.id })
}
```

- [ ] **Step 3: Commit**
```bash
git add src/sync/queue-processor.ts src/generators/llms-txt.ts src/generators/llms-full-txt.ts src/generators/sitemap.ts
git commit -m "perf(queue): share data across generators, cleanup old jobs"
```

---

### Task 13: Fix Regenerate-All to Not Block

**Files:**
- Modify: `src/endpoints/admin-api.ts`

- [ ] **Step 1: Replace sequential deletes with bulk where-based delete**

```typescript
if (body.all) {
  // Use Payload's bulk delete instead of sequential
  const result = await payload.delete({
    collection: 'ai-content',
    where: { sourceCollection: { not_equals: '__aggregate' } },
  })
  // Queue initial re-sync by resetting the aggregate markers
  await payload.create({
    collection: 'ai-sync-queue',
    data: { jobType: 'initial-sync', status: 'pending' },
  })
  return Response.json({
    message: 'Full regeneration queued',
    count: Array.isArray(result.docs) ? result.docs.length : 0,
  })
}
```

Note: Check if Payload v3 supports `payload.delete` with a `where` clause. If not, batch the deletes in pages of 100 using `Promise.all`.

- [ ] **Step 2: Commit**
```bash
git add src/endpoints/admin-api.ts
git commit -m "perf(regenerate): use bulk delete instead of sequential loop"
```

---

### Task 14: Defer Initial Sync from onInit

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Queue initial sync instead of running inline**

Replace the blocking `await runInitialSync(...)` in onInit with a queue job:

```typescript
// Queue initial sync (non-blocking) instead of running inline
await payload.create({
  collection: 'ai-sync-queue',
  data: { jobType: 'initial-sync', status: 'pending' },
})
```

- [ ] **Step 2: Handle initial-sync job in queue-processor**

In `queue-processor.ts`, add processing for `initial-sync` jobs that calls `runInitialSync`:

```typescript
// At the start of processQueue:
await processInitialSyncJobs(payload, pluginOptions)

async function processInitialSyncJobs(
  payload: Payload,
  pluginOptions: ResolvedPluginConfig,
): Promise<void> {
  const jobs = await payload.find({
    collection: 'ai-sync-queue',
    where: { jobType: { equals: 'initial-sync' }, status: { equals: 'pending' } },
    limit: 1,
  })
  if (jobs.docs.length === 0) return

  const job = jobs.docs[0]
  await payload.update({ collection: 'ai-sync-queue', id: job.id, data: { status: 'processing' } })

  try {
    await runInitialSync(payload, pluginOptions, pluginOptions.enabledCollections)
    await payload.update({ collection: 'ai-sync-queue', id: job.id, data: { status: 'completed', processedAt: new Date().toISOString() } })
  } catch (error: any) {
    await payload.update({ collection: 'ai-sync-queue', id: job.id, data: { status: 'failed', errorMessage: error.message } })
  }
}
```

- [ ] **Step 3: Commit**
```bash
git add src/index.ts src/sync/queue-processor.ts
git commit -m "perf(init): defer initial sync to queue instead of blocking onInit"
```

---

### Task 15: Fix Collection Access Control

**Files:**
- Modify: `src/collections/ai-content.ts`
- Modify: `src/collections/ai-sync-queue.ts`

- [ ] **Step 1: Add explicit access control**

`ai-content.ts`:
```typescript
access: {
  read: () => true, // Public read for AI consumers
  create: ({ req }) => Boolean(req.user),
  update: ({ req }) => Boolean(req.user),
  delete: ({ req }) => Boolean(req.user),
},
```

`ai-sync-queue.ts`:
```typescript
access: {
  read: ({ req }) => Boolean(req.user),
  create: ({ req }) => Boolean(req.user),
  update: ({ req }) => Boolean(req.user),
  delete: ({ req }) => Boolean(req.user),
},
```

- [ ] **Step 2: Commit**
```bash
git add src/collections/ai-content.ts src/collections/ai-sync-queue.ts
git commit -m "fix(access): add explicit access control to plugin collections"
```

---

### Task 16: Fix Package.json and Build System

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `tsup.config.ts`
- Modify: `.gitignore`
- Delete: `src/ambient.d.ts`

- [ ] **Step 1: Fix peerDependencies**

```json
"peerDependencies": {
  "payload": "^3.0.0",
  "openai": ">=4.0.0",
  "@anthropic-ai/sdk": ">=0.20.0"
},
"peerDependenciesMeta": {
  "openai": { "optional": true },
  "@anthropic-ai/sdk": { "optional": true }
}
```

- [ ] **Step 2: Fix exports map**

Remove `require` conditions (Payload v3 is ESM-only). Add `react-server` condition:

```json
"exports": {
  ".": {
    "import": "./dist/index.js",
    "types": "./dist/index.d.ts"
  },
  "./client": {
    "import": "./dist/admin/views/DashboardClient.js",
    "types": "./dist/admin/views/DashboardClient.d.ts"
  },
  "./rsc": {
    "react-server": "./dist/admin/views/ScrapeAiView.js",
    "import": "./dist/admin/views/ScrapeAiView.js",
    "types": "./dist/admin/views/ScrapeAiView.d.ts"
  },
  "./NavLink": {
    "import": "./dist/admin/components/NavLink.js",
    "types": "./dist/admin/components/NavLink.d.ts"
  },
  "./discovery": {
    "import": "./dist/discovery/index.js",
    "types": "./dist/discovery/index.d.ts"
  },
  "./next": {
    "import": "./dist/next.js",
    "types": "./dist/next.d.ts"
  }
}
```

- [ ] **Step 3: Add tsup and update build script**

```json
"scripts": {
  "build": "tsup",
  "dev": "tsup --watch",
  "prepublishOnly": "npm run build"
},
"devDependencies": {
  "payload": "^3.0.0",
  "typescript": "^5.0.0",
  "@types/node": "^20.0.0",
  "@types/react": "^19.0.0",
  "react": "^19.0.0",
  "tsup": "^8.0.0"
}
```

- [ ] **Step 4: Create tsup.config.ts**

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/admin/views/ScrapeAiView.tsx',
    'src/admin/views/DashboardClient.tsx',
    'src/admin/components/NavLink.tsx',
    'src/discovery/index.ts',
    'src/next.ts',
  ],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['payload', 'react', 'react-dom', 'openai', '@anthropic-ai/sdk'],
  outDir: 'dist',
  splitting: false,
  treeshake: true,
})
```

- [ ] **Step 5: Fix tsconfig.json moduleResolution**

Change `"moduleResolution": "bundler"` to `"moduleResolution": "node16"`. (tsup handles bundling now.)

- [ ] **Step 6: Add dist/ to .gitignore**

Remove the committed `dist/` directory and add it to `.gitignore`:
```
dist/
```

- [ ] **Step 7: Delete src/ambient.d.ts**

No longer needed — the optional peer deps with proper version ranges provide their own types.

- [ ] **Step 8: Commit**
```bash
git rm -r dist/
git add package.json tsconfig.json tsup.config.ts .gitignore
git rm src/ambient.d.ts
git commit -m "build: switch to tsup, fix exports map, fix peer deps"
```

---

### Task 17: Native Admin UI — Server View with DefaultTemplate

**Files:**
- Rewrite: `src/admin/views/ScrapeAiView.tsx`

- [ ] **Step 1: Rewrite ScrapeAiView as proper RSC**

```tsx
import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { DashboardClient } from './DashboardClient'

export function ScrapeAiView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <DashboardClient />
      </Gutter>
    </DefaultTemplate>
  )
}
```

Note: Import paths may differ based on the Payload v3 version. Check `@payloadcms/next` and `@payloadcms/ui` exports. If `DefaultTemplate` is not available from `@payloadcms/next/templates`, use the simpler wrapper:

```tsx
import { Gutter } from '@payloadcms/ui'

export function ScrapeAiView(props: AdminViewServerProps) {
  return (
    <div className="payload-default">
      <Gutter>
        <DashboardClient />
      </Gutter>
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/admin/views/ScrapeAiView.tsx
git commit -m "feat(admin): use Payload DefaultTemplate and Gutter for native look"
```

---

### Task 18: Native Admin UI — Replace Dashboard with CSS-Class-Based Client Component

**Files:**
- Create: `src/admin/views/DashboardClient.tsx`
- Create: `src/admin/styles.css`
- Delete: `src/admin/views/Dashboard.tsx`

- [ ] **Step 1: Create DashboardClient.tsx with Payload CSS classes**

Replace all inline styles with CSS classes using Payload's CSS custom properties. The component structure stays the same but uses semantic class names:

```tsx
'use client'

import React, { useState } from 'react'
import { StatusBar } from '../components/StatusBar'
import { CollectionToggles } from '../components/CollectionToggles'
import { ContentTable } from '../components/ContentTable'
import { LlmsTxtManager } from '../components/LlmsTxtManager'
import { AiSettings } from '../components/AiSettings'
import { EndpointsPanel } from '../components/EndpointsPanel'
import './styles.css'

type Tab = 'content' | 'collections' | 'llms-txt' | 'ai-settings' | 'endpoints'

export const DashboardClient: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('content')
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const tabs: { key: Tab; label: string }[] = [
    { key: 'content', label: 'Content Entries' },
    { key: 'collections', label: 'Collections' },
    { key: 'llms-txt', label: 'llms.txt' },
    { key: 'ai-settings', label: 'AI Settings' },
    { key: 'endpoints', label: 'Endpoints' },
  ]

  return (
    <div className="scrape-ai">
      <header className="scrape-ai__header">
        <h1 className="scrape-ai__title">Scrape AI</h1>
        <p className="scrape-ai__description">AI-friendly content generation dashboard</p>
      </header>

      <StatusBar />

      <nav className="scrape-ai__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`scrape-ai__tab ${activeTab === tab.key ? 'scrape-ai__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="scrape-ai__content">
        {activeTab === 'content' && <ContentTable />}
        {activeTab === 'collections' && <CollectionToggles />}
        {activeTab === 'llms-txt' && <LlmsTxtManager />}
        {activeTab === 'ai-settings' && <AiSettings />}
        {activeTab === 'endpoints' && <EndpointsPanel siteUrl={siteUrl} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create styles.css using Payload's CSS custom properties**

```css
/* Payload CMS native styling for Scrape AI plugin */

.scrape-ai {
  /* Inherits Payload's theme variables automatically */
}

.scrape-ai__header {
  margin-bottom: var(--spacing-l, 24px);
}

.scrape-ai__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--theme-text, #333);
}

.scrape-ai__description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--theme-elevation-500, #888);
}

.scrape-ai__tabs {
  display: flex;
  gap: 4px;
  margin-bottom: var(--spacing-l, 20px);
  border-bottom: 1px solid var(--theme-elevation-150, #e0e0e0);
}

.scrape-ai__tab {
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: var(--font-body, inherit);
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--theme-elevation-500, #888);
  transition: color 0.15s, border-color 0.15s;
}

.scrape-ai__tab:hover {
  color: var(--theme-text, #333);
}

.scrape-ai__tab--active {
  color: var(--theme-text, #333);
  border-bottom-color: var(--theme-success-500, #22c55e);
  font-weight: 600;
}

.scrape-ai__content {
  min-height: 400px;
}

/* Common card pattern (matches Payload's card style) */
.scrape-ai-card {
  padding: var(--spacing-l, 20px);
  background: var(--theme-elevation-0, #fff);
  border: 1px solid var(--theme-elevation-150, #e0e0e0);
  border-radius: var(--style-radius-s, 4px);
}

.scrape-ai-card__heading {
  margin: 0 0 var(--spacing-m, 16px) 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--theme-text, #333);
}

/* Status pill */
.scrape-ai-pill {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
}

.scrape-ai-pill--success { background: var(--theme-success-500, #22c55e); }
.scrape-ai-pill--warning { background: var(--theme-warning-500, #eab308); }
.scrape-ai-pill--error { background: var(--theme-error-500, #ef4444); }

/* Buttons matching Payload style */
.scrape-ai-btn {
  padding: 8px 16px;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: var(--font-body, inherit);
  border: none;
  border-radius: var(--style-radius-s, 4px);
  cursor: pointer;
  transition: opacity 0.15s;
}

.scrape-ai-btn:hover { opacity: 0.9; }
.scrape-ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.scrape-ai-btn--primary {
  background: var(--theme-success-500, #22c55e);
  color: white;
}

.scrape-ai-btn--secondary {
  background: transparent;
  border: 1px solid var(--theme-elevation-250, #ccc);
  color: var(--theme-text, #333);
}

/* Table matching Payload's table style */
.scrape-ai-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.scrape-ai-table th {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--theme-elevation-150, #e0e0e0);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--theme-elevation-500, #888);
}

.scrape-ai-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--theme-elevation-100, #f0f0f0);
  color: var(--theme-text, #333);
}

.scrape-ai-table tr:hover td {
  background: var(--theme-elevation-50, #fafafa);
}

/* Form fields matching Payload's form style */
.scrape-ai-field {
  margin-bottom: var(--spacing-m, 12px);
}

.scrape-ai-field__label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--theme-text, #333);
}

.scrape-ai-field__input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--theme-elevation-250, #ddd);
  border-radius: var(--style-radius-s, 4px);
  font-size: 0.875rem;
  font-family: var(--font-body, inherit);
  background: var(--theme-input-bg, #fff);
  color: var(--theme-text, #333);
  box-sizing: border-box;
}

.scrape-ai-field__input:focus {
  outline: none;
  border-color: var(--theme-success-500, #22c55e);
  box-shadow: 0 0 0 2px var(--theme-success-100, rgba(34, 197, 94, 0.2));
}

.scrape-ai-field__hint {
  font-size: 0.75rem;
  color: var(--theme-elevation-400, #999);
  margin-top: 4px;
}
```

- [ ] **Step 3: Delete old Dashboard.tsx**
```bash
git rm src/admin/views/Dashboard.tsx
```

- [ ] **Step 4: Update sub-components to use CSS classes**

Update `StatusBar.tsx`, `ContentTable.tsx`, `CollectionToggles.tsx`, `AiSettings.tsx`, `EndpointsPanel.tsx`, `LlmsTxtManager.tsx` to replace inline `style` objects with CSS class names from `styles.css`. Import `'../styles.css'` at the top (or let the parent import handle it since CSS is global once imported).

Each component should use the shared CSS classes: `scrape-ai-card`, `scrape-ai-table`, `scrape-ai-btn`, `scrape-ai-pill`, `scrape-ai-field`, etc.

- [ ] **Step 5: Commit**
```bash
git add src/admin/
git commit -m "feat(admin): native Payload UI with CSS classes, remove inline styles"
```

---

### Task 19: Fix NavLink to Match Payload's Sidebar Style

**Files:**
- Modify: `src/admin/components/NavLink.tsx`

- [ ] **Step 1: Use Payload's nav styling**

```tsx
'use client'

import React from 'react'
import './styles.css'

const NavLink: React.FC = () => {
  return (
    <a href="/admin/scrape-ai" className="nav-link scrape-ai-nav">
      <span className="scrape-ai-nav__icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </span>
      <span>Scrape AI</span>
    </a>
  )
}

export default NavLink
```

Add to styles.css:
```css
.scrape-ai-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px var(--gutter-h, 16px);
  font-size: 0.8125rem;
  color: var(--theme-elevation-650, #444);
  text-decoration: none;
  transition: background-color 0.15s;
}

.scrape-ai-nav:hover {
  background-color: var(--theme-elevation-50, #f5f5f5);
  color: var(--theme-text, #333);
}

.scrape-ai-nav__icon {
  display: flex;
  width: 16px;
  height: 16px;
}
```

- [ ] **Step 2: Commit**
```bash
git add src/admin/components/NavLink.tsx src/admin/styles.css
git commit -m "feat(admin): NavLink uses Payload CSS classes"
```

---

### Task 20: Build and Verify

- [ ] **Step 1: Install tsup**
```bash
cd /Users/leonardozambaiti/Code/payload-plugin-scrape-ai
pnpm add -D tsup
```

- [ ] **Step 2: Build**
```bash
pnpm build
```

Fix any TypeScript/build errors.

- [ ] **Step 3: Verify exports resolve**
```bash
node -e "import('payload-plugin-scrape-ai')" 2>&1 || echo "check needed"
```

- [ ] **Step 4: Commit final state**
```bash
git add -A
git commit -m "chore: production-hardened build, all fixes applied"
```

- [ ] **Step 5: Push**
```bash
git push origin master
```

---

## Summary of All Changes

| Category | Fix | Impact |
|---|---|---|
| Security | Auth guards on GET admin endpoints | Critical |
| Security | Remove API key from database | Critical |
| Security | Explicit access control on collections | Important |
| Correctness | Fix block extraction (numbers, booleans) | Data loss |
| Correctness | Add Slate code/table handling | Data loss |
| Correctness | Fix YAML frontmatter escaping (newlines, arrays) | Correctness |
| Correctness | Fix datePublished in JSON-LD (use createdAt) | Correctness |
| Correctness | Pass description to JSON-LD | Correctness |
| Correctness | Fix context-query double-scoring | Correctness |
| Correctness | Filter drafts from llms-full.txt | Consistency |
| Correctness | Fix year-rollover in monthly counter reset | Correctness |
| Performance | Remove generator hard limits, use pagination | Scalability |
| Performance | Share data across generators in rebuild | 3x fewer queries |
| Performance | Optimize HEAD to skip full GET execution | Performance |
| Performance | Fix regenerate-all to use bulk delete | Critical |
| Performance | Defer initial sync to queue | Startup time |
| Performance | Context-query field select | Memory |
| Performance | Queue job cleanup (24h TTL) | DB growth |
| Stability | .unref() on all intervals | Process lifecycle |
| Stability | Scheduler stop() function | HMR support |
| Stability | Rate limiter destroy() | HMR support |
| Build | Remove fs.readFileSync from robots-txt | Serverless compat |
| Build | Switch to tsup | Proper ESM output |
| Build | Fix peer dependencies | Package manager compat |
| Build | Fix exports map | React Server Components |
| Build | Remove dist/ from git | Clean repo |
| Admin UI | Native DefaultTemplate + Gutter | Professional look |
| Admin UI | CSS classes instead of inline styles | Maintainable |
| Admin UI | Payload CSS variable system | Theme consistency |
