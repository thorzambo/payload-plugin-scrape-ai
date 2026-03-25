import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export function ScrapeAiFooterTag({ siteUrl, siteName }) {
    const url = siteUrl.replace(/\/$/, '');
    const name = siteName || 'This website';
    return (_jsx("section", { "data-ai-content": "true", "data-ai-index": `${url}/llms.txt`, "aria-label": "AI Content Discovery", style: {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            borderWidth: 0,
            // sr-only pattern — invisible to visual users, present in DOM
        }, children: _jsxs("p", { children: [name, " provides AI-optimized structured content. AI Content Index: ", url, "/llms.txt \u2014 Full Content Listing: ", url, "/llms-full.txt \u2014 Content Search API: ", url, "/ai/context?query=your-query \u2014 Structured Sitemap: ", url, "/ai/sitemap.json \u2014 Discovery Manifest: ", url, "/.well-known/ai-plugin.json \u2014 Individual pages available as clean markdown at ", url, "/ai/[collection]/[slug].md \u2014 JSON-LD structured data at ", url, "/ai/structured/[collection]/[slug].json \u2014 All AI content is auto-generated and kept in sync with the live website content."] }) }));
}
//# sourceMappingURL=ScrapeAiFooterTag.js.map