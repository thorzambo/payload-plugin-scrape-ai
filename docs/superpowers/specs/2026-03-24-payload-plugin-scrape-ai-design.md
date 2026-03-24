# payload-plugin-scrape-ai — Design Specification

## Overview

A Payload CMS v3 plugin that automatically generates AI-friendly content mirrors of any Payload website. It follows the llms.txt standard, produces structured markdown, JSON-LD, a content relationship graph, and an MCP-compatible context endpoint — all kept in sync with the live site content without user intervention.

The plugin works out of the box with zero dependencies via deterministic algorithmic transformation, and optionally unlocks AI enrichment (summaries, entity extraction, semantic chunking) when the admin configures an LLM provider.

## Goals

- Make any Payload CMS website fully accessible to AI agents and LLMs
- Zero user intervention: content syncs automatically on every change
- Standards-compliant: llms.txt, JSON-LD, clean markdown
- Admin visibility: read-only dashboard showing everything generated
- Database-agnostic: works with MongoDB, Postgres, SQLite via Payload Local API only

## Non-Goals

- Payload v2 support
- Editing AI-generated content from the admin panel
- Replacing the website's existing SEO or sitemap infrastructure
- Acting as a general-purpose web scraper

---

## 1. Plugin Configuration

```typescript
import { scrapeAiPlugin } from 'payload-plugin-scrape-ai'

export default buildConfig({
  plugins: [
    scrapeAiPlugin({
      // Optional: explicitly include/exclude collections
      // If omitted, smart detection kicks in
      collections: ['pages', 'posts', 'products'],
      exclude: ['users', 'media'],

      // AI enrichment (optional)
      ai: {
        provider: 'openai' | 'anthropic',
        apiKey: process.env.AI_API_KEY,
        model: 'gpt-4o-mini',
      },

      // Sync settings
      sync: {
        debounceMs: 30000, // aggregate rebuild delay (default 30s)
      },

      // Base URL for generating canonical links in llms.txt
      siteUrl: 'https://example.com',
      siteName: 'My Website',
      siteDescription: 'A brief description of what this site is about',
    }),
  ],
})
```

### Smart Collection Detection

When no `collections` array is provided, the plugin scans all collections for fields matching these signals:
- `type: 'richText'`
- `type: 'text'` with name `title` or `name`
- `type: 'text'` with name `slug` or `path`

Collections matching 2+ signals are auto-detected as content collections. The admin can then toggle these on/off from the dashboard.

---

## 2. Plugin-Owned Data

### Collections

| Collection | Purpose |
|---|---|
| `ai-content` | Stores generated markdown + metadata per content entry |
| `ai-sync-queue` | Tracks pending/processing sync jobs |

### Globals

| Global | Purpose |
|---|---|
| `ai-config` | Admin-managed settings: collection toggles, AI config, priorities, site info |

### Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/llms.txt` | GET | Curated llms.txt index |
| `/llms-full.txt` | GET | Comprehensive llms-full.txt |
| `/ai/:collection/:slug.md` | GET | Per-page clean markdown |
| `/ai/sitemap.json` | GET | Content relationships + hierarchy |
| `/ai/structured/:collection/:slug.json` | GET | JSON-LD structured data per entry |
| `/ai/mcp/context` | GET | MCP-compatible context query endpoint |

---

## 3. Content Transformation Pipeline

### Stage 1 — Extraction (always runs, zero cost)

- Traverses the Payload document recursively
- Rich text (Lexical/Slate) → clean Markdown (headings, lists, links, images, tables)
- Relationship fields → resolved links with titles (`[Related Post Title](/ai/posts/related-post.md)`)
- Blocks/layouts → semantic sections with headers
- Media references → alt text + URL
- Strips admin-only fields, internal IDs, timestamps

### Stage 2 — Structuring (always runs, zero cost)

- Adds YAML frontmatter: `title`, `slug`, `collection`, `lastModified`, `locale`, `contentType`, `canonicalUrl`
- Builds semantic sections: main content, related content, metadata
- Detects parent/child via slug patterns (`/services/web-design` → child of `/services`)
- Detects relationships via populated relation fields
- Generates JSON-LD structured data (WebPage, Article, Product, etc. — inferred from collection fields)

### Stage 3 — AI Enrichment (optional, only when AI provider configured + enabled)

- Sends the Stage 2 markdown to the configured LLM
- Generates: 1-2 sentence summary, key topics/entities list, content category classification
- Performs semantic chunking: splits content into meaningful sections for RAG pipelines (each chunk gets an ID and topic label)
- All AI-generated metadata stored separately from the base content, clearly labeled as AI-generated
- If AI call fails: content is still served with Stage 1+2 output, error logged, retry queued

### Output per document

```markdown
---
title: "Web Design Services"
slug: "services/web-design"
collection: "pages"
canonicalUrl: "https://example.com/services/web-design"
lastModified: "2026-03-24T12:00:00Z"
contentType: "WebPage"
parent: "services"
topics: ["web design", "UI/UX", "responsive"]
summary: "Professional web design services..."
chunks: 4
---

# Web Design Services

Professional web design services focused on...

## Related Content
- [Our Portfolio](/ai/pages/portfolio.md)
- [Contact Us](/ai/pages/contact.md)
```

---

## 4. Sync Architecture (Hybrid Event + Queue)

### Immediate Path (per-document)

```
Document afterChange/afterDelete hook fires
  → Extract + Structure + (optional) AI Enrich
  → Upsert into ai-content collection
  → Mark entry status: "synced" (or "error" if failed)
  → Push "rebuild-aggregates" job to ai-sync-queue
```

### Debounced Path (aggregate files)

```
ai-sync-queue accumulates "rebuild-aggregates" jobs
  → onInit starts a setInterval (default 30s)
  → Each tick: check if queue has pending rebuild jobs
  → If yes: drain queue, rebuild all aggregate files in one pass:
      - llms.txt (curated: top-priority pages from admin config)
      - llms-full.txt (all synced content, organized by collection)
      - ai/sitemap.json (full relationship graph + hierarchy)
  → Store rebuilt aggregates in ai-content with special slugs
  → Clear processed queue entries
  → If no pending jobs: skip (zero work)
```

### Status Lifecycle

```
pending → processing → synced
                    → error (with error message, retryable)
                        → error-permanent (after 3 consecutive failures)
```

### Initial Sync

- `onInit` detects if `ai-content` is empty
- Triggers a full scan: queries all enabled collections, runs every document through the pipeline
- Progress tracked in `ai-sync-queue` so the admin dashboard shows "Initial sync: 47/120 pages"
- Debounced aggregate rebuild fires once after the full scan completes

### Deletion Handling

- `afterDelete` hook removes the corresponding `ai-content` entry
- Pushes aggregate rebuild to queue

### Error Recovery

- Failed entries stay in `error` status with the error message
- A periodic retry (every 5 min) picks up errored entries and re-attempts
- After 3 consecutive failures: `error-permanent`, visible in dashboard
- Admin can manually trigger retry from the dashboard

---

## 5. AI-Friendly Endpoints

### GET /llms.txt

Curated index following the llms.txt standard:

```markdown
# My Website

> A brief description of what this site is about

## Pages
- [Web Design Services](https://example.com/ai/pages/services-web-design.md): Professional web design and UI/UX services
- [About Us](https://example.com/ai/pages/about.md): Company background and team

## Blog
- [Getting Started with AI](https://example.com/ai/posts/getting-started-ai.md): Introduction to AI integration

## Optional
- [Privacy Policy](https://example.com/ai/pages/privacy.md): Legal privacy information
```

Admin controls which entries appear and their priority order. Entries without explicit priority are auto-sorted by importance (pages before posts, parent before children).

### GET /llms-full.txt

Every synced entry across all enabled collections, grouped by collection, with descriptions. No curation — everything included.

### GET /ai/:collection/:slug.md

Individual page markdown (Stage 2/3 output). `Content-Type: text/markdown`.

### GET /ai/sitemap.json

Machine-readable content graph:

```json
{
  "siteName": "My Website",
  "siteUrl": "https://example.com",
  "generatedAt": "2026-03-24T12:00:00Z",
  "totalEntries": 47,
  "collections": {
    "pages": {
      "count": 12,
      "entries": [
        {
          "title": "Web Design Services",
          "slug": "services/web-design",
          "url": "/ai/pages/services-web-design.md",
          "canonicalUrl": "https://example.com/services/web-design",
          "parent": "services",
          "children": [],
          "relatedTo": ["portfolio", "contact"],
          "topics": ["web design", "UI/UX"],
          "lastModified": "2026-03-24T12:00:00Z",
          "contentType": "WebPage"
        }
      ]
    }
  },
  "hierarchy": {
    "services": {
      "children": ["services/web-design", "services/branding"],
      "url": "/ai/pages/services.md"
    }
  }
}
```

### GET /ai/structured/:collection/:slug.json

JSON-LD per entry:

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Web Design Services",
  "url": "https://example.com/services/web-design",
  "description": "Professional web design services...",
  "dateModified": "2026-03-24T12:00:00Z",
  "isPartOf": { "@type": "WebSite", "name": "My Website" },
  "mainEntity": {}
}
```

### GET /ai/mcp/context?query=...

Accepts a `query` parameter. Returns the most relevant content chunks for an AI agent's query. When AI enrichment is enabled, uses semantic chunk matching. When disabled, falls back to keyword search across titles and content.

All endpoints return proper `Content-Type` headers and include `Cache-Control` with `ETag` based on last sync timestamp.

---

## 6. Admin Dashboard

Custom view at `/admin/scrape-ai` in the Payload admin panel. All content is **read-only** — the admin controls plugin behavior but cannot edit generated markdown.

### Top Bar — Global Status

- Sync status indicator: green "All Synced" / yellow "3 Pending" / red "2 Errors"
- Total entries indexed: "47 pages across 4 collections"
- Last aggregate rebuild timestamp
- "Regenerate All" button (triggers full re-sync)

### Panel 1 — Collection Toggles

- Lists all detected content collections (smart detection results)
- Each row: collection name, document count, toggle switch (on/off)
- Toggling off removes that collection's entries from AI output on next sync
- Toggling on triggers sync for that collection's documents
- Collections explicitly passed in plugin config are pre-enabled

### Panel 2 — Content Entries Table

- Sortable/filterable table of all ai-content entries
- Columns: Title, Collection, Status (synced/pending/error), Last Synced, Has AI Enrichment
- Click any row → slides open a preview pane showing:
  - The generated markdown (rendered)
  - The raw markdown (code view toggle)
  - JSON-LD structured data
  - Chunk breakdown (if AI enrichment enabled)
  - "Regenerate" button for this single entry
- Filter by: collection, status, date range
- Bulk action: "Regenerate Selected"

### Panel 3 — llms.txt Manager

- Live preview of current llms.txt output
- Drag-and-drop priority ordering of entries
- Mark entries as "Optional" section (per the spec)
- Entries not in the priority list go to llms-full.txt only
- "Preview llms-full.txt" toggle

### Panel 4 — AI Enrichment Settings

- Toggle AI enrichment on/off
- Provider selector (OpenAI / Anthropic)
- API key field (masked)
- Model selector
- "Test Connection" button
- Usage stats: total API calls this month, estimated cost

### Panel 5 — Endpoints & Access

- Lists all active endpoints with their full URLs
- Copy-to-clipboard for each
- Live test: click any endpoint to see its current output in a modal
- MCP connection instructions for AI agents

---

## 7. Content Relationships & Hierarchy

### Inferred Hierarchy

- Slug patterns: `/services/web-design` is detected as child of `/services`
- Relationship fields: populated `hasMany`/`relationship` fields create bidirectional links
- Category/tag fields: shared taxonomy creates implicit grouping

### Admin-Controlled Hierarchy

- From the llms.txt Manager panel, the admin can:
  - Define priority entries (surface prominently in llms.txt)
  - Group entries into custom sections
  - Mark entries as "Optional" per the llms.txt spec
  - Override inferred parent/child relationships

### Output

The hierarchy is reflected in:
- `llms.txt` section organization
- `ai/sitemap.json` hierarchy object
- Per-page frontmatter (`parent`, `children` fields)
- Related content links at bottom of each page markdown

---

## 8. File Structure

```
payload-plugin-scrape-ai/
├── src/
│   ├── index.ts                          # Plugin entry point
│   ├── types.ts                          # All TypeScript interfaces/types
│   │
│   ├── collections/
│   │   ├── ai-content.ts                 # Generated content storage
│   │   └── ai-sync-queue.ts              # Sync job queue
│   │
│   ├── globals/
│   │   └── ai-config.ts                  # Admin settings global
│   │
│   ├── hooks/
│   │   ├── afterChange.ts                # Triggers content regeneration
│   │   └── afterDelete.ts                # Cleans up deleted content
│   │
│   ├── endpoints/
│   │   ├── llms-txt.ts                   # GET /llms.txt
│   │   ├── llms-full-txt.ts             # GET /llms-full.txt
│   │   ├── content-markdown.ts           # GET /ai/:collection/:slug.md
│   │   ├── sitemap-json.ts              # GET /ai/sitemap.json
│   │   ├── structured-data.ts           # GET /ai/structured/:collection/:slug.json
│   │   └── mcp-context.ts              # GET /ai/mcp/context
│   │
│   ├── pipeline/
│   │   ├── extract.ts                    # Stage 1: document → raw markdown
│   │   ├── structure.ts                  # Stage 2: frontmatter, relations, JSON-LD
│   │   ├── enrich.ts                     # Stage 3: optional AI enrichment
│   │   └── transform.ts                  # Orchestrates the 3 stages
│   │
│   ├── sync/
│   │   ├── scheduler.ts                  # setInterval debounce loop
│   │   ├── initial-sync.ts              # First-run full collection scan
│   │   ├── queue-processor.ts           # Drains queue, rebuilds aggregates
│   │   └── error-recovery.ts            # Retry logic for failed entries
│   │
│   ├── detection/
│   │   └── smart-detect.ts              # Auto-detect content collections
│   │
│   ├── ai/
│   │   ├── provider.ts                   # AI provider abstraction
│   │   ├── summarize.ts                  # Summary generation
│   │   ├── chunk.ts                      # Semantic chunking
│   │   └── entities.ts                   # Entity/topic extraction
│   │
│   ├── generators/
│   │   ├── llms-txt.ts                   # Builds llms.txt content
│   │   ├── llms-full-txt.ts             # Builds llms-full.txt content
│   │   ├── sitemap.ts                    # Builds ai/sitemap.json
│   │   └── json-ld.ts                   # Builds JSON-LD per content type
│   │
│   └── admin/
│       ├── views/
│       │   └── Dashboard.tsx             # Main plugin dashboard
│       └── components/
│           ├── StatusBar.tsx             # Global sync status
│           ├── CollectionToggles.tsx     # On/off per collection
│           ├── ContentTable.tsx          # Entries table + preview
│           ├── LlmsTxtManager.tsx       # Priority ordering + preview
│           ├── AiSettings.tsx           # AI enrichment config
│           └── EndpointsPanel.tsx        # Endpoint URLs + live test
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 9. Technology & Dependencies

- **Runtime:** Node.js (whatever the host Payload app uses)
- **Payload:** v3.x only (v3.80.0+ tested)
- **Database:** Agnostic — uses Payload Local API exclusively, no raw DB queries
- **Admin UI:** React components using `@payloadcms/ui` primitives, referenced by string import paths (v3 pattern)
- **AI Providers (optional):** OpenAI SDK (`openai`), Anthropic SDK (`@anthropic-ai/sdk`)
- **Zero required dependencies** beyond `payload` peer dependency — AI SDKs are optional peer deps

---

## 10. Security Considerations

- AI provider API keys stored in Payload Global (encrypted at rest by the DB layer), never exposed to client components
- All `/ai/*` endpoints are public by design (the whole point is AI agent access) — but rate-limited
- Admin dashboard actions require Payload authentication
- The plugin never executes user-provided content as code
- AI enrichment prompts are hardcoded in the plugin, not user-configurable (prevents prompt injection)
