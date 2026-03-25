# payload-plugin-scrape-ai

[![GitHub Sponsors](https://img.shields.io/github/sponsors/thorzambo?style=flat&logo=github&label=Sponsor&color=1F1F25)](https://github.com/sponsors/thorzambo)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=flat&logo=buymeacoffee&logoColor=000)](https://buymeacoffee.com/leozamba19s)
[![Payload CMS](https://img.shields.io/badge/Payload%20CMS-v3-20C5D9?style=flat)](https://payloadcms.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Make any Payload CMS website instantly accessible to AI agents and LLMs.**

Auto-generates AI-friendly content mirrors of your entire site — [llms.txt](https://llmstxt.org/), structured markdown, JSON-LD, content relationship graphs, and a context search API. Everything stays in sync as content changes.

![CleanShot 2026-03-25 at 09 55 19@2x](https://github.com/user-attachments/assets/4aa74433-6a10-46e0-8023-fdd4f0603a44)

---

## What It Generates

| Endpoint | Description |
|----------|-------------|
| **`/llms.txt`** | Curated content index (llms.txt standard) |
| **`/llms-full.txt`** | Complete content listing |
| **`/ai/:collection/:slug.md`** | Per-page markdown with YAML frontmatter |
| **`/ai/sitemap.json`** | Content relationship graph |
| **`/ai/structured/:collection/:slug`** | JSON-LD structured data |
| **`/ai/context?query=...`** | Relevance-scored search API |
| **`/.well-known/ai-plugin.json`** | Discovery manifest |

---

## Quick Start

### 1. Install

```bash
npm install github:thorzambo/payload-plugin-scrape-ai
```

### 2. Add to Payload config

```typescript
// payload.config.ts
import { scrapeAiPlugin } from 'payload-plugin-scrape-ai'

export default buildConfig({
  plugins: [
    scrapeAiPlugin({
      siteUrl: process.env.NEXT_PUBLIC_SERVER_URL || 'https://your-website.com',
      siteName: 'My Website',
      siteDescription: 'A brief description for the llms.txt header',
    }),
  ],
})
```

### 3. Wrap your Next.js config

```javascript
// next.config.mjs
import { withScrapeAi } from 'payload-plugin-scrape-ai/next'

export default withScrapeAi({
  // ... your existing Next.js config
})
```

This serves AI content at root-level URLs (`/llms.txt`, `/ai/*`, `/.well-known/ai-plugin.json`) and adds HTTP `Link` headers for discovery on every page.

### 4. Add discovery metadata (recommended)

For Next.js App Router — spread into your layout metadata:

```typescript
// app/layout.tsx
import { generateAiMetadata } from 'payload-plugin-scrape-ai'

export const metadata = {
  ...generateAiMetadata('https://your-website.com'),
  // ... your other metadata
}
```

Or use the React components for Pages Router / manual control:

```tsx
import { ScrapeAiMeta, ScrapeAiFooterTag } from 'payload-plugin-scrape-ai/discovery'

<head>
  <ScrapeAiMeta siteUrl="https://your-website.com" siteName="My Website" />
</head>
<body>
  {children}
  <ScrapeAiFooterTag siteUrl="https://your-website.com" />
</body>
```

### 5. Visit `/admin/scrape-ai`

The dashboard gives you full control: collection toggles, content preview, llms.txt ordering, AI settings, endpoint testing, and a dead letter queue for failed entries.

---

## Configuration

```typescript
scrapeAiPlugin({
  siteUrl: 'https://your-website.com',       // required
  siteName: 'My Website',                     // llms.txt header
  siteDescription: 'What this site is about', // llms.txt header

  // Collection control (auto-detected if omitted)
  collections: ['pages', 'posts', 'products'],
  exclude: ['users', 'media'],

  // Draft handling
  drafts: 'published-only', // default — or 'include-drafts'

  // AI enrichment (optional — plugin works fully without it)
  ai: {
    provider: 'openai',    // or 'anthropic'
    apiKey: process.env.AI_API_KEY,
    model: 'gpt-4.1-nano', // use the built-in token estimator to pick
  },

  // Sync tuning
  sync: {
    debounceMs: 30000,
    initialSyncConcurrency: 5,
    rateLimitPerMinute: 60,
  },

  // Collection overrides (advanced — customize generated collections)
  aiContentOverrides: { access: { read: () => true } },
  aiSyncQueueOverrides: {},
  aiAggregatesOverrides: {},

  enabled: false, // disable runtime, keep DB schema
})
```

---

## AI Enrichment

Works without any AI provider. When configured, it adds per-document:

- **Summary** — 1-2 sentence description
- **Topics & Entities** — Key themes, named entities, category
- **Semantic Chunks** — Content split for RAG pipelines

Uses a single batched API call per document. The built-in **Token Estimator** (AI Settings tab) shows exact cost before you enable anything.

| Provider | Budget Model | Standard Model |
|----------|-------------|---------------|
| OpenAI | `gpt-4.1-nano` | `gpt-4.1-mini` |
| Anthropic | `claude-haiku-4-5` | `claude-sonnet-4-6` |

![CleanShot 2026-03-25 at 09 52 36@2x](https://github.com/user-attachments/assets/80cfdf91-7fef-4522-ac10-d323ea469a9d)

---

## Architecture

```
Content Change → afterChange Hook
                    │
                    ├─ Stage 1: Extract (Lexical/Slate → Markdown)
                    ├─ Stage 2: Structure (Frontmatter, JSON-LD, Hierarchy)
                    ├─ Upsert to ai-content collection
                    │
                    ├─ Queue: AI enrichment (async, never blocks save)
                    └─ Queue: Aggregate rebuild (deduplicated)
                                │
                          Scheduler → llms.txt, sitemap, llms-full.txt
```

Three collections are created: `ai-content` (document mirrors), `ai-aggregates` (llms.txt, sitemap cache), `ai-sync-queue` (job queue). All hidden from the admin sidebar.

---

## Compatibility

- **Payload CMS** v3.0.0+
- **Database** — Any (MongoDB, Postgres, SQLite)
- **Rich Text** — Lexical and Slate
- **Hosting** — Long-lived Node.js (Vercel/serverless: scheduler won't fire between invocations, but content syncs on every save via hooks)

---

## Local Development

When developing locally with pnpm, use tarball install to avoid duplicate `@payloadcms/ui` context issues:

```bash
# In the plugin repo
npm pack

# In your consuming project
pnpm install /path/to/payload-plugin-scrape-ai-0.2.0.tgz
```

Direct `pnpm install /path/to/plugin` creates a symlink that causes React context duplication with `@payloadcms/ui`.

---

## Support

If this plugin saves you time:

- [Sponsor on GitHub](https://github.com/sponsors/thorzambo)
- [Buy Me a Coffee](https://buymeacoffee.com/leozamba19s)

## License

MIT

---

Built by [Leonardo Zambaiti](https://leonardo-zambaiti.zepoch.io/) / [Zepoch](https://zepoch.io)
