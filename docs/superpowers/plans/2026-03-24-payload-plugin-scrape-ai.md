# payload-plugin-scrape-ai Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Payload CMS v3 plugin that auto-generates AI-friendly content (llms.txt, markdown, JSON-LD, context API) from any Payload website, kept in sync via hooks, with an admin dashboard.

**Architecture:** Curried plugin function modifies Payload config to inject 2 collections, 1 global, 6 endpoints, afterChange/afterDelete hooks, an admin view, and a background sync scheduler. Content flows through a 3-stage pipeline (extract → structure → optional AI enrich). Hybrid sync: immediate for per-doc markdown, debounced for aggregate files.

**Tech Stack:** TypeScript, Payload CMS v3, React (admin components via @payloadcms/ui), optional openai/anthropic SDKs.

**Spec:** `docs/superpowers/specs/2026-03-24-payload-plugin-scrape-ai-design.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts`
- Create: `src/types.ts`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "payload-plugin-scrape-ai",
  "version": "0.1.0",
  "description": "Payload CMS plugin that auto-generates AI-friendly content (llms.txt, markdown, JSON-LD)",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "peerDependencies": {
    "payload": "^3.0.0"
  },
  "peerDependenciesMeta": {
    "openai": { "optional": true },
    "@anthropic-ai/sdk": { "optional": true }
  },
  "devDependencies": {
    "payload": "^3.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  },
  "license": "MIT"
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create src/types.ts with all TypeScript interfaces**

Define: `ScrapeAiPluginOptions`, `AiProviderConfig`, `SyncConfig`, `AiContentDoc`, `AiSyncQueueDoc`, `AiConfigGlobal`, `TransformResult`, `PipelineContext`.

- [ ] **Step 4: Create src/index.ts plugin entry point (skeleton)**

The curried plugin function that takes options, validates `siteUrl` is present, and returns the config modifier. Skeleton only — collections/endpoints/hooks added in subsequent tasks.

- [ ] **Step 5: Install dependencies and verify build**

Run: `npm install && npm run build`
Expected: Clean compilation, `dist/` directory created.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json src/
git commit -m "feat: scaffold plugin with types and entry point"
```

---

## Task 2: Collections & Global Definitions

**Files:**
- Create: `src/collections/ai-content.ts`
- Create: `src/collections/ai-sync-queue.ts`
- Create: `src/globals/ai-config.ts`
- Modify: `src/index.ts` — register collections and global

- [ ] **Step 1: Create ai-content collection**

Define all fields per spec: `sourceCollection`, `sourceDocId`, `slug`, `title`, `markdown`, `jsonLd`, `status`, `errorMessage`, `retryCount`, `aiMeta`, `parentSlug`, `relatedSlugs`, `locale`, `isDraft`, `lastSynced`. Set `admin.hidden: true` (managed via custom dashboard, not default list view). Add compound indexes via `indexes` config if available, otherwise rely on field-level `index: true`.

- [ ] **Step 2: Create ai-sync-queue collection**

Fields: `jobType`, `sourceCollection`, `sourceDocId`, `status`, `createdAt`, `processedAt`, `errorMessage`. Set `admin.hidden: true`.

- [ ] **Step 3: Create ai-config global**

Fields: `enabledCollections`, `aiEnabled`, `aiProvider`, `aiApiKey` (with `admin.condition: () => false`), `aiModel`, `llmsTxtPriority`, `llmsTxtSections`, `aiApiCallCount`, `aiApiCallCountResetDate`, `lastAggregateRebuild`.

- [ ] **Step 4: Register in plugin index.ts**

Spread collections and globals into the incoming config. Follow the spec pattern: always add collections (even if disabled), only add runtime features when enabled.

- [ ] **Step 5: Verify build compiles**

Run: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/collections/ src/globals/ src/index.ts
git commit -m "feat: add ai-content, ai-sync-queue collections and ai-config global"
```

---

## Task 3: Smart Collection Detection

**Files:**
- Create: `src/detection/smart-detect.ts`
- Modify: `src/index.ts` — use detection to resolve enabled collections

- [ ] **Step 1: Implement smart-detect.ts**

Function `detectContentCollections(config: Config, options: ScrapeAiPluginOptions)` that:
1. If `options.collections` provided: use those minus `options.exclude`
2. Else: scan all `config.collections`, check fields for richText, title/name text fields, slug/path text fields. Score 2+ = content collection.
3. Return `string[]` of collection slugs.

- [ ] **Step 2: Wire detection into index.ts**

Call `detectContentCollections` early in the plugin function. Store result for use by hooks and onInit. Pass detected collections to the `ai-config` global's default `enabledCollections` value.

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/detection/ src/index.ts
git commit -m "feat: add smart collection detection with config precedence"
```

---

## Task 4: Content Transformation Pipeline — Stage 1 (Extract)

**Files:**
- Create: `src/pipeline/extract.ts`

- [ ] **Step 1: Implement document field extractor**

Function `extractDocument(doc: Record<string, any>, collectionConfig: CollectionConfig, payload: Payload): string` that:
1. Recursively walks the document fields using the collection's field config
2. For each field type:
   - `richText`: detect Lexical vs Slate via field config `editor` property. Convert Lexical nodes to markdown (headings, paragraphs, lists, links, images, bold/italic, code blocks, tables). For Slate, convert Slate nodes similarly.
   - `text`/`textarea`: output as-is (skip fields named `id`, `createdAt`, `updatedAt`, `_status`)
   - `number`/`date`/`email`/`select`/`radio`/`checkbox`: format as key-value
   - `relationship`/`upload`: resolve to link `[title](/ai/collection/slug.md)` if populated
   - `blocks`/`array`: iterate items, add `### Block Name` header, recurse
   - `group`/`row`/`collapsible`: recurse into sub-fields
   - `tabs`: iterate tabs, add `## Tab Label` header, recurse
   - `json`/`code`: format as fenced code block
   - Skip: `ui`, `point` field types
3. Return clean markdown string.

- [ ] **Step 2: Implement Lexical-to-Markdown serializer**

Function `lexicalToMarkdown(lexicalState: any): string`. Handle node types: `paragraph`, `heading`, `list`, `listitem`, `link`, `image`, `quote`, `code`, `horizontalrule`, `table`, `tablerow`, `tablecell`. Handle format marks: bold, italic, underline, strikethrough, code.

- [ ] **Step 3: Implement Slate-to-Markdown serializer**

Function `slateToMarkdown(slateNodes: any[]): string`. Similar structure but for Slate node format. Handle: paragraphs, headings (h1-h6), links, images, lists (ul/ol), list-items, blockquotes, code.

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/pipeline/extract.ts
git commit -m "feat: implement Stage 1 extraction pipeline with Lexical/Slate serializers"
```

---

## Task 5: Content Transformation Pipeline — Stage 2 (Structure)

**Files:**
- Create: `src/pipeline/structure.ts`
- Create: `src/generators/json-ld.ts`

- [ ] **Step 1: Implement structuring function**

Function `structureContent(params: { markdown: string, doc: any, collectionSlug: string, collectionConfig: CollectionConfig, siteUrl: string, allContent?: AiContentDoc[] }): TransformResult` that:
1. Extracts title from first field named `title` or `name`, falls back to `id`
2. Extracts slug from field named `slug` or `path`, falls back to `id`
3. Detects parent via slug pattern (e.g., `services/web-design` → parent `services`)
4. Finds children by checking if other slugs start with `thisSlug/`
5. Resolves related content from relationship fields
6. Builds YAML frontmatter block
7. Appends `## Related Content` section with links
8. Returns `{ markdown, frontmatter, jsonLd, slug, title, parentSlug, relatedSlugs }`

- [ ] **Step 2: Implement slug transformation**

Function `toUrlSlug(slug: string): string` — replaces `/` with `-`.
Function `toOriginalSlug(urlSlug: string): string` — inverse (best-effort, stored original is authoritative).

- [ ] **Step 3: Implement JSON-LD generator**

Function `generateJsonLd(params: { title, slug, collection, siteUrl, siteName, description?, lastModified, contentType? }): object`.
Map collection slugs to schema.org types: `pages` → `WebPage`, `posts`/`articles` → `Article`, `products` → `Product`, default → `CreativeWork`. Build standard JSON-LD with `@context`, `@type`, `name`, `url`, `dateModified`, `isPartOf`.

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/pipeline/structure.ts src/generators/json-ld.ts
git commit -m "feat: implement Stage 2 structuring with frontmatter, hierarchy, and JSON-LD"
```

---

## Task 6: Content Transformation Pipeline — Stage 3 (AI Enrichment)

**Files:**
- Create: `src/pipeline/enrich.ts`
- Create: `src/ai/provider.ts`
- Create: `src/ai/summarize.ts`
- Create: `src/ai/chunk.ts`
- Create: `src/ai/entities.ts`

- [ ] **Step 1: Implement AI provider abstraction**

`src/ai/provider.ts`: Class `AiProvider` with method `complete(prompt: string, systemPrompt: string): Promise<string>`. Factory function `createAiProvider(config: AiProviderConfig): AiProvider | null`. Tries dynamic `require()` for the SDK, catches error and returns `null` with logged warning if not installed.

- [ ] **Step 2: Implement summarize.ts**

Function `generateSummary(markdown: string, provider: AiProvider): Promise<string>`. Sends markdown with a system prompt asking for a 1-2 sentence summary. Returns the summary string.

- [ ] **Step 3: Implement entities.ts**

Function `extractEntities(markdown: string, provider: AiProvider): Promise<{ topics: string[], entities: string[], category: string }>`. System prompt asks for JSON output with topics, named entities, and content category.

- [ ] **Step 4: Implement chunk.ts**

Function `semanticChunk(markdown: string, provider: AiProvider): Promise<Array<{ id: string, topic: string, content: string }>>`. If provider available: sends markdown with prompt to identify logical sections. If no provider: falls back to splitting on `##` headings.

- [ ] **Step 5: Implement enrich.ts (Stage 3 orchestrator)**

Function `enrichContent(markdown: string, provider: AiProvider): Promise<AiMeta>`. Calls summarize, extractEntities, semanticChunk in parallel. Returns `{ summary, topics, entities, category, chunks }`. Catches individual failures gracefully — partial AI meta is better than none.

- [ ] **Step 6: Verify build**

Run: `npm run build`

- [ ] **Step 7: Commit**

```bash
git add src/pipeline/enrich.ts src/ai/
git commit -m "feat: implement Stage 3 AI enrichment with provider abstraction"
```

---

## Task 7: Pipeline Orchestrator

**Files:**
- Create: `src/pipeline/transform.ts`

- [ ] **Step 1: Implement transform.ts**

Function `transformDocument(params: { doc, collectionSlug, collectionConfig, payload, pluginOptions, aiProvider? }): Promise<TransformResult>`:
1. Call `extractDocument()` — Stage 1
2. Call `structureContent()` — Stage 2
3. Return result (AI enrichment is handled async via queue, not here)

Function `enrichDocument(params: { aiContentDoc, aiProvider }): Promise<AiMeta>`:
1. Call `enrichContent()` with the stored markdown
2. Return AI metadata to be merged into the ai-content entry

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pipeline/transform.ts
git commit -m "feat: add pipeline orchestrator for transform and enrich flows"
```

---

## Task 8: Hooks (afterChange & afterDelete)

**Files:**
- Create: `src/hooks/afterChange.ts`
- Create: `src/hooks/afterDelete.ts`
- Modify: `src/index.ts` — inject hooks into target collections

- [ ] **Step 1: Implement afterChange hook**

Function `createAfterChangeHook(pluginOptions: ScrapeAiPluginOptions)` returns a `CollectionAfterChangeHook`:
1. Check draft status: if `drafts === 'published-only'` and `doc._status === 'draft'`, return early
2. Call `transformDocument()` (Stage 1+2 only, synchronous-fast)
3. Upsert into `ai-content`: find by `sourceCollection + sourceDocId + locale`, create or update
4. If AI enrichment enabled in ai-config: push `enrich-document` job to `ai-sync-queue`
5. Push `rebuild-aggregates` job to `ai-sync-queue`
6. Return `doc` unchanged

- [ ] **Step 2: Implement afterDelete hook**

Function `createAfterDeleteHook(pluginOptions: ScrapeAiPluginOptions)` returns a hook:
1. Delete matching `ai-content` entry by `sourceCollection + sourceDocId`
2. Push `rebuild-aggregates` job to `ai-sync-queue`

- [ ] **Step 3: Wire hooks into index.ts**

In the plugin function, map over collections. For each collection in the enabled set, spread existing hooks and append the afterChange/afterDelete hooks.

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/ src/index.ts
git commit -m "feat: add afterChange and afterDelete hooks with draft filtering"
```

---

## Task 9: Aggregate Generators

**Files:**
- Create: `src/generators/llms-txt.ts`
- Create: `src/generators/llms-full-txt.ts`
- Create: `src/generators/sitemap.ts`

- [ ] **Step 1: Implement llms-txt.ts generator**

Function `generateLlmsTxt(params: { payload, siteUrl, siteName, siteDescription }): Promise<string>`:
1. Read `ai-config` global for `llmsTxtPriority` and `llmsTxtSections`
2. Query `ai-content` for all synced, non-aggregate, non-draft entries
3. Build markdown following the llms.txt spec:
   - `# siteName`
   - `> siteDescription`
   - For each section: `## Section Name` + prioritized entries as `- [Title](url): description`
   - `## Optional` section for entries marked optional
4. Return the complete llms.txt string

- [ ] **Step 2: Implement llms-full-txt.ts generator**

Function `generateLlmsFullTxt(params: { payload, siteUrl, siteName, siteDescription }): Promise<string>`:
1. Query ALL synced non-aggregate `ai-content` entries
2. Group by `sourceCollection`
3. Build: `# siteName` + `> description` + per-collection `## Collection` sections
4. Include drafts if `include-drafts` mode (they appear here but not in llms.txt)

- [ ] **Step 3: Implement sitemap.ts generator**

Function `generateAiSitemap(params: { payload, siteUrl, siteName }): Promise<object>`:
1. Query all synced non-aggregate entries
2. Build the `collections` object grouped by sourceCollection
3. Build the `hierarchy` object from parentSlug/children relationships
4. Return the full JSON structure per spec

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/generators/
git commit -m "feat: implement llms.txt, llms-full.txt, and sitemap.json generators"
```

---

## Task 10: Sync Scheduler & Queue Processor

**Files:**
- Create: `src/sync/scheduler.ts`
- Create: `src/sync/queue-processor.ts`
- Create: `src/sync/initial-sync.ts`
- Create: `src/sync/error-recovery.ts`
- Modify: `src/index.ts` — add onInit to start scheduler

- [ ] **Step 1: Implement queue-processor.ts**

Function `processQueue(payload: Payload, pluginOptions: ScrapeAiPluginOptions, aiProvider?: AiProvider): Promise<void>`:
1. Query `ai-sync-queue` for `status: 'pending'` entries, ordered by `createdAt`
2. Process `enrich-document` jobs: load ai-content entry, call `enrichDocument()`, update `aiMeta`
3. Process `rebuild-aggregates` jobs: call all three generators, upsert aggregate entries in `ai-content`
4. Update `ai-config.lastAggregateRebuild` timestamp
5. Mark processed queue entries as `completed`, set `processedAt`
6. On error: mark queue entry as `failed` with error message

- [ ] **Step 2: Implement scheduler.ts**

Function `startScheduler(payload: Payload, pluginOptions: ScrapeAiPluginOptions, aiProvider?: AiProvider): void`:
1. `setInterval` at `pluginOptions.sync.debounceMs` (default 30000)
2. Each tick: call `processQueue()`
3. Also start error recovery interval (every 5 min)
4. Also check `aiApiCallCountResetDate` — if month changed, reset counter to 0

- [ ] **Step 3: Implement initial-sync.ts**

Function `runInitialSync(payload: Payload, pluginOptions: ScrapeAiPluginOptions, enabledCollections: string[]): Promise<void>`:
1. Check if `ai-content` has any non-aggregate entries. If yes, skip (not first run).
2. For each enabled collection: query all docs (paginated, respect `initialSyncConcurrency`)
3. For each doc: run `transformDocument()`, create `ai-content` entry
4. After all docs processed: push single `rebuild-aggregates` job
5. Track progress by creating `initial-sync` queue entries

- [ ] **Step 4: Implement error-recovery.ts**

Function `retryErrors(payload: Payload, pluginOptions: ScrapeAiPluginOptions, aiProvider?: AiProvider): Promise<void>`:
1. Query `ai-content` where `status: 'error'` and `retryCount < 3`
2. For each: re-run transform pipeline, increment `retryCount`
3. On success: set status `synced`, reset `retryCount`
4. On failure: if `retryCount >= 3`, set status `error-permanent`

- [ ] **Step 5: Wire into index.ts onInit**

Extend `config.onInit`:
1. Call existing onInit if present
2. Resolve AI provider (try to create from config, handle missing SDK)
3. Resolve enabled collections (from config + smart detect + ai-config global)
4. Call `runInitialSync()`
5. Call `startScheduler()`

- [ ] **Step 6: Verify build**

Run: `npm run build`

- [ ] **Step 7: Commit**

```bash
git add src/sync/ src/index.ts
git commit -m "feat: implement sync scheduler, queue processor, initial sync, and error recovery"
```

---

## Task 11: API Endpoints

**Files:**
- Create: `src/endpoints/llms-txt.ts`
- Create: `src/endpoints/llms-full-txt.ts`
- Create: `src/endpoints/content-markdown.ts`
- Create: `src/endpoints/sitemap-json.ts`
- Create: `src/endpoints/structured-data.ts`
- Create: `src/endpoints/context-query.ts`
- Create: `src/endpoints/rate-limiter.ts`
- Modify: `src/index.ts` — register all endpoints

- [ ] **Step 1: Implement rate-limiter.ts**

Class `RateLimiter` with sliding window per IP:
- Constructor takes `maxPerMinute: number`
- Method `check(ip: string): boolean` — returns true if allowed, false if rate limited
- Uses `Map<string, number[]>` tracking request timestamps per IP
- Cleans up old entries periodically
- Extract IP from `req.headers.get('x-forwarded-for')` or connection info

Helper function `getRateLimitedResponse()` returning `new Response('Too Many Requests', { status: 429 })`.

- [ ] **Step 2: Implement GET /llms.txt endpoint**

Handler: read aggregate entry from `ai-content` where `sourceDocId: '__llms-txt'`. Return with `Content-Type: text/markdown`, `Cache-Control: public, max-age=60`, `ETag` from `lastSynced`.

- [ ] **Step 3: Implement GET /llms-full.txt endpoint**

Same pattern as llms.txt but `sourceDocId: '__llms-full-txt'`.

- [ ] **Step 4: Implement GET /ai/:collection/:slug.md endpoint**

Parse `collection` and `slug` from route params. Query `ai-content` by `sourceCollection` and `slug` (handle locale param). Return markdown with proper headers. Return 404 if not found.

- [ ] **Step 5: Implement GET /ai/sitemap.json endpoint**

Read aggregate entry `__sitemap-json`. Return with `Content-Type: application/json`.

- [ ] **Step 6: Implement GET /ai/structured/:collection/:slug.json endpoint**

Query `ai-content` by collection and slug. Return `jsonLd` field. 404 if not found.

- [ ] **Step 7: Implement GET /ai/context endpoint**

Parse `query`, `limit` (default 5, max 20), `collection` params. Implement keyword search:
1. Tokenize query into terms
2. Query `ai-content` for all synced non-aggregate entries (filter by collection if provided)
3. Score each: term matches in title (3x weight), slug (2x), markdown (1x), aiMeta.topics (4x if present)
4. Sort by score descending, take top `limit`
5. Return response per spec schema

- [ ] **Step 8: Register all endpoints in index.ts**

Add all 6 endpoint configs to `config.endpoints` array. Apply rate limiter wrapper to each.

- [ ] **Step 9: Verify build**

Run: `npm run build`

- [ ] **Step 10: Commit**

```bash
git add src/endpoints/ src/index.ts
git commit -m "feat: implement all 6 API endpoints with rate limiting"
```

---

## Task 12: Admin Dashboard — Server Components & API

**Files:**
- Create: `src/endpoints/admin-api.ts` — internal API endpoints for dashboard data
- Modify: `src/index.ts` — register admin API endpoints

- [ ] **Step 1: Implement admin API endpoints**

These are authenticated endpoints for the dashboard React components to consume:

1. `GET /api/scrape-ai/status` — returns `{ totalEntries, pendingCount, errorCount, collections: { slug: count }, lastRebuild }`
2. `GET /api/scrape-ai/entries?page=1&limit=20&collection=&status=` — paginated ai-content entries
3. `GET /api/scrape-ai/entry/:id` — single entry with full markdown and metadata
4. `POST /api/scrape-ai/regenerate` — body: `{ ids: string[] }` or `{ all: true }` — triggers re-sync
5. `POST /api/scrape-ai/toggle-collection` — body: `{ collection: string, enabled: boolean }` — updates ai-config
6. `POST /api/scrape-ai/ai-settings` — body: `{ aiEnabled, aiProvider, aiApiKey, aiModel }` — updates ai-config
7. `POST /api/scrape-ai/test-ai` — tests AI provider connection
8. `GET /api/scrape-ai/llms-txt-config` — returns current priority/sections config
9. `POST /api/scrape-ai/llms-txt-config` — updates priority ordering and sections
10. `GET /api/scrape-ai/detected-collections` — returns smart-detected collections with enabled state

All POST endpoints require `req.user` (Payload auth). Return 401 if not authenticated.

- [ ] **Step 2: Register admin endpoints in index.ts**

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/endpoints/admin-api.ts src/index.ts
git commit -m "feat: add authenticated admin API endpoints for dashboard"
```

---

## Task 13: Admin Dashboard — React Components

**Files:**
- Create: `src/admin/views/Dashboard.tsx`
- Create: `src/admin/components/StatusBar.tsx`
- Create: `src/admin/components/CollectionToggles.tsx`
- Create: `src/admin/components/ContentTable.tsx`
- Create: `src/admin/components/LlmsTxtManager.tsx`
- Create: `src/admin/components/AiSettings.tsx`
- Create: `src/admin/components/EndpointsPanel.tsx`
- Modify: `src/index.ts` — register admin view

- [ ] **Step 1: Create StatusBar.tsx**

Client component (`'use client'`). Fetches `/api/scrape-ai/status`. Displays:
- Green/yellow/red status pill based on pending/error counts
- Total indexed count and collection breakdown
- Last rebuild timestamp
- "Regenerate All" button that POSTs to `/api/scrape-ai/regenerate` with `{ all: true }`

Use `@payloadcms/ui` components: `Button`, `Pill`. Use `fetch` for API calls.

- [ ] **Step 2: Create CollectionToggles.tsx**

Fetches `/api/scrape-ai/detected-collections`. Renders each collection as a row with name, doc count, and a toggle switch. Toggle POSTs to `/api/scrape-ai/toggle-collection`.

- [ ] **Step 3: Create ContentTable.tsx**

Fetches `/api/scrape-ai/entries` with pagination/filter params. Renders sortable table. Click row → expand inline preview showing rendered markdown (use a simple `<pre>` for raw, or render markdown to HTML). "Regenerate" button per entry. Bulk select + "Regenerate Selected".

- [ ] **Step 4: Create LlmsTxtManager.tsx**

Fetches `/api/scrape-ai/llms-txt-config`. Shows current llms.txt preview. Lists entries with drag handles for reordering (use native drag-and-drop HTML5 API, keep it simple). Toggle "Optional" flag per entry. Save button POSTs updated config. Also fetches and shows live llms-full.txt preview on toggle.

- [ ] **Step 5: Create AiSettings.tsx**

Fetches current AI config from `/api/scrape-ai/status`. Toggle on/off, provider dropdown, API key input (masked), model input. "Test Connection" button POSTs to `/api/scrape-ai/test-ai`. Shows API call count this month.

- [ ] **Step 6: Create EndpointsPanel.tsx**

Static list of all endpoint URLs (computed from `siteUrl`). Each with a "Copy" button (uses `navigator.clipboard.writeText`). "Test" button opens endpoint in a modal/iframe or fetches and displays response.

- [ ] **Step 7: Create Dashboard.tsx (main view)**

Composes all 5 panels + StatusBar into a single page with tab navigation or vertical sections. Uses `@payloadcms/ui` layout primitives where available.

- [ ] **Step 8: Register admin view in index.ts**

Add to `config.admin.components.views`:
```typescript
scrapeAi: {
  Component: 'payload-plugin-scrape-ai/admin/views/Dashboard',
  path: '/scrape-ai',
}
```

Also add nav link to admin sidebar via `config.admin.components.afterNavLinks` or similar.

- [ ] **Step 9: Verify build**

Run: `npm run build`

- [ ] **Step 10: Commit**

```bash
git add src/admin/ src/index.ts
git commit -m "feat: implement admin dashboard with all 5 panels"
```

---

## Task 14: Final Integration & Polish

**Files:**
- Modify: `src/index.ts` — final assembly of all pieces
- Modify: `src/types.ts` — any missing types

- [ ] **Step 1: Final index.ts assembly**

Ensure the plugin function:
1. Validates `siteUrl` required
2. Runs smart detection
3. Adds both collections (always, even if disabled)
4. Adds ai-config global
5. If not disabled: adds hooks to target collections, adds all endpoints, adds admin view
6. Extends onInit with initial sync + scheduler

- [ ] **Step 2: Add nav link for admin sidebar**

Add to `config.admin.components.beforeDashboard` or `afterNavLinks` to show "Scrape AI" link in admin nav. Use string path reference per Payload v3 pattern.

- [ ] **Step 3: Verify full build**

Run: `npm run build`
Expected: Clean compilation, all files in dist/

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: complete plugin integration and admin nav link"
```

- [ ] **Step 5: Push to remote**

```bash
git remote add origin <repo-url>  # if needed
git push -u origin master
```
