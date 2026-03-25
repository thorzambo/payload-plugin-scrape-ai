import React from 'react';
export function ScrapeAiFooterTag({ siteUrl, siteName }) {
    const url = siteUrl.replace(/\/$/, '');
    const name = siteName || 'This website';
    return /*#__PURE__*/ React.createElement("section", {
        "data-ai-content": "true",
        "data-ai-index": `${url}/llms.txt`,
        "aria-label": "AI Content Discovery",
        style: {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            borderWidth: 0
        }
    }, /*#__PURE__*/ React.createElement("p", null, name, " provides AI-optimized structured content. AI Content Index: ", url, "/llms.txt — Full Content Listing: ", url, "/llms-full.txt — Content Search API: ", url, "/ai/context?query=your-query — Structured Sitemap: ", url, "/ai/sitemap.json — Discovery Manifest: ", url, "/.well-known/ai-plugin.json — Individual pages available as clean markdown at ", url, "/ai/[collection]/[slug].md — JSON-LD structured data at ", url, "/ai/structured/[collection]/[slug].json — All AI content is auto-generated and kept in sync with the live website content."));
}

//# sourceMappingURL=ScrapeAiFooterTag.js.map