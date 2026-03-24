# payload-plugin-scrape-ai

[![GitHub Sponsors](https://img.shields.io/github/sponsors/thorzambo?style=flat&logo=github&label=Sponsor&color=1F1F25)](https://github.com/sponsors/thorzambo)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=flat&logo=buymeacoffee&logoColor=000)](https://buymeacoffee.com/leozamba19s)
[![Payload CMS](https://img.shields.io/badge/Payload%20CMS-v3-20C5D9?style=flat)](https://payloadcms.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Make any Payload CMS website instantly accessible to AI agents and LLMs.**

This plugin automatically generates AI-friendly content mirrors of your entire Payload CMS website — following the [llms.txt standard](https://llmstxt.org/), producing structured markdown, JSON-LD, a content relationship graph, and a context search API. Everything stays in sync as your content changes, with zero manual intervention.

<!-- TODO: Screenshot of the admin dashboard overview -->
![Dashboard Overview](docs/images/dashboard-overview.png)

---

## Why?

AI agents and LLMs can't efficiently parse your website's HTML. They need clean, structured content in formats they understand. This plugin solves that by auto-generating:

- **`/llms.txt`** — A curated index of your most important content (the llms.txt standard)
- **`/llms-full.txt`** — Comprehensive listing of all content
- **Per-page markdown** — Clean `.md` files for every page, post, and product
- **JSON-LD structured data** — Schema.org compliant metadata
- **AI sitemap** — Content relationships and hierarchy graph
- **Context search API** — Relevance-scored content search for AI agents

Think of it as SEO, but for AI.

---

## Features

### Automatic Content Sync

Every time content changes in your CMS, the plugin regenerates the AI-friendly version instantly. No cron jobs, no manual triggers, no maintenance.

<!-- TODO: Diagram showing the sync flow: Content Change → Hook → Pipeline → AI Content -->
![Sync Flow](docs/images/sync-flow.png)

### Smart Collection Detection

The plugin automatically identifies which collections contain content worth exposing to AI (pages, posts, products) and ignores utility collections (users, media, API keys). You can override this from the admin dashboard.

### Three-Stage Pipeline

| Stage | What it does | Cost |
|-------|-------------|------|
| **Extract** | Converts rich text (Lexical & Slate), relationships, blocks, and all field types into clean markdown | Free |
| **Structure** | Adds YAML frontmatter, detects hierarchy, generates JSON-LD, builds related content links | Free |
| **Enrich** *(optional)* | AI-generated summaries, topic extraction, entity recognition, semantic chunking for RAG | Pay-per-use |

Stages 1 & 2 run on every content change. Stage 3 is optional and only runs if you configure an AI provider.

<!-- TODO: Screenshot of the content preview panel showing generated markdown -->
![Content Preview](docs/images/content-preview.png)

### Token Estimation & Model Recommendation

Before enabling AI enrichment, the plugin estimates total token usage across all your content and recommends the cheapest model that can handle the workload. No guessing, no surprise bills.

<!-- TODO: Screenshot of the token estimation panel with model comparison table -->
![Token Estimation](docs/images/token-estimation.png)

### Admin Dashboard

A full control center inside your Payload admin panel:

| Panel | What it does |
|-------|-------------|
| **Status Bar** | Live sync status, entry counts, last rebuild timestamp |
| **Collection Toggles** | Enable/disable AI generation per collection |
| **Content Entries** | Browse all generated content with preview pane |
| **llms.txt Manager** | Priority ordering, section management, live preview |
| **AI Settings** | Provider config, model selection, token estimation |
| **Endpoints** | All API URLs with copy & live test buttons |

<!-- TODO: Screenshot of the collection toggles panel -->
![Collection Toggles](docs/images/collection-toggles.png)

---

## Quick Start

### 1. Install the package

```bash
# From GitHub (current)
npm install github:thorzambo/payload-plugin-scrape-ai

# From npm (coming soon)
# npm install @thorzambo/payload-plugin-scrape-ai
```

### 2. Add to your Payload config

Payload plugins **do not auto-register**. Like every other Payload plugin (`@payloadcms/plugin-seo`, `@payloadcms/plugin-search`, etc.), you need to manually add it to your `plugins` array.

If your config is in a single file:

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { scrapeAiPlugin } from 'payload-plugin-scrape-ai'

export default buildConfig({
  plugins: [
    scrapeAiPlugin({
      siteUrl: 'https://your-website.com', // required
      siteName: 'My Website',
      siteDescription: 'A brief description for the llms.txt header',
    }),
    // ... your other plugins
  ],
  // ... your existing config
})
```

If your plugins are in a separate file (common pattern):

```typescript
// src/plugins/index.ts
import { scrapeAiPlugin } from 'payload-plugin-scrape-ai'
import type { Plugin } from 'payload'

export const plugins: Plugin[] = [
  scrapeAiPlugin({
    siteUrl: process.env.NEXT_PUBLIC_SERVER_URL || 'https://your-website.com',
    siteName: 'My Website',
    siteDescription: 'What this site is about',
    collections: ['pages', 'posts', 'products'], // optional: explicit list
    exclude: ['users', 'media'],                   // optional: never include these
  }),
  // ... your other plugins
]
```

### 3. Restart your dev server

```bash
npm run dev
# or
pnpm dev
```

### 4. Visit the dashboard

Go to **`/admin/scrape-ai`** in your Payload admin panel. You'll see the "Scrape AI" link in the sidebar.

On first load, the plugin will:
1. Create `ai-content` and `ai-sync-queue` collections in your database
2. Create the `ai-config` global for dashboard settings
3. Auto-detect content collections (or use the ones you specified)
4. Run an initial sync of all existing documents
5. Start the background scheduler for ongoing sync
6. Serve content at `/api/llms.txt` and other endpoints

---

## Configuration

```typescript
scrapeAiPlugin({
  // REQUIRED
  siteUrl: 'https://your-website.com',

  // Optional: Site metadata for llms.txt header
  siteName: 'My Website',
  siteDescription: 'What this site is about',

  // Optional: Explicit collection control
  collections: ['pages', 'posts', 'products'], // only these
  exclude: ['users', 'media'],                  // never these
  // If omitted: smart detection auto-discovers content collections

  // Optional: Draft handling
  drafts: 'published-only', // default: only published docs
  // drafts: 'include-drafts', // also process drafts (marked in output)

  // Optional: AI enrichment
  ai: {
    provider: 'openai',    // or 'anthropic'
    apiKey: process.env.AI_API_KEY,
    model: 'gpt-4.1-nano', // use token estimator to pick the right one
  },

  // Optional: Sync tuning
  sync: {
    debounceMs: 30000,          // aggregate rebuild delay (default: 30s)
    initialSyncConcurrency: 5,  // parallel docs during first sync
    rateLimitPerMinute: 60,     // public endpoint rate limit per IP
  },

  // Optional: Disable entirely (keeps DB schema, removes runtime)
  enabled: false,
})
```

---

## Endpoints

All endpoints are public by design (that's the point — AI agents need access).

| Endpoint | Content-Type | Description |
|----------|-------------|-------------|
| `GET /api/llms.txt` | `text/markdown` | Curated content index |
| `GET /api/llms-full.txt` | `text/markdown` | Complete content listing |
| `GET /api/ai/:collection/:slug.md` | `text/markdown` | Individual page markdown |
| `GET /api/ai/sitemap.json` | `application/json` | Content graph with hierarchy |
| `GET /api/ai/structured/:collection/:slug.json` | `application/json` | JSON-LD per entry |
| `GET /api/ai/context?query=...&limit=5` | `application/json` | Relevance-scored search |

### Locale Support

All content endpoints accept `?locale=en` to get localized versions (if your Payload has localization enabled).

---

## AI Enrichment (Optional)

The plugin works fully without any AI provider. When you do configure one, it adds:

- **Summaries** — 1-2 sentence description of each page
- **Topics** — Key themes and topics extracted from content
- **Entities** — Named entities (companies, products, people)
- **Categories** — Content classification
- **Semantic Chunks** — Content split into meaningful sections for RAG pipelines

### Supported Providers

| Provider | Budget Model | Standard Model |
|----------|-------------|---------------|
| **OpenAI** | `gpt-4.1-nano` ($0.10/MTok in) | `gpt-4.1-mini` ($0.40/MTok in) |
| **Anthropic** | `claude-haiku-4-5-20251001` ($0.80/MTok in) | `claude-sonnet-4-6` ($3.00/MTok in) |

Use the built-in **Token Estimator** (AI Settings → Estimate Tokens) to see exactly how much your content will cost before enabling AI.

---

## How It Works

```
Content Change in Payload CMS
        │
        ▼
  afterChange Hook
        │
        ├─ Stage 1: Extract (Lexical/Slate → Markdown)
        ├─ Stage 2: Structure (Frontmatter, JSON-LD, Hierarchy)
        ├─ Upsert to ai-content collection
        │
        ├─ Queue: AI enrichment (async, never blocks save)
        └─ Queue: Aggregate rebuild (debounced 30s)
                    │
                    ▼
              Scheduler processes queue
                    │
                    ├─ Regenerate llms.txt
                    ├─ Regenerate llms-full.txt
                    └─ Regenerate sitemap.json
```

---

## Compatibility

- **Payload CMS:** v3.0.0+
- **Database:** Any (MongoDB, Postgres, SQLite) — uses Payload Local API only
- **Rich Text:** Lexical (default) and Slate editors
- **Node.js:** Whatever your Payload app uses

---

## Support

If this plugin saves you time, consider supporting its development:

- [Sponsor on GitHub](https://github.com/sponsors/thorzambo)
- [Buy Me a Coffee](https://buymeacoffee.com/leozamba19s)

---

## License

MIT

---

## Contributing

Issues and PRs welcome at [github.com/thorzambo/payload-plugin-scrape-ai](https://github.com/thorzambo/payload-plugin-scrape-ai).

---

Built by [Leonardo Zambaiti](https://leonardo-zambaiti.zepoch.io/) / [Zepoch](https://zepoch.io)
