import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
export function ScrapeAiMeta({ siteUrl, siteName, siteDescription }) {
    const url = siteUrl.replace(/\/$/, '');
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName || url,
        url: url,
        description: siteDescription || undefined,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${url}/ai/context?query={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
        // Non-standard but parseable: advertise AI content
        additionalProperty: [
            {
                '@type': 'PropertyValue',
                name: 'ai-content-index',
                value: `${url}/llms.txt`,
            },
            {
                '@type': 'PropertyValue',
                name: 'ai-content-full',
                value: `${url}/llms-full.txt`,
            },
            {
                '@type': 'PropertyValue',
                name: 'ai-discovery-manifest',
                value: `${url}/.well-known/ai-plugin.json`,
            },
        ],
    };
    return (_jsxs(_Fragment, { children: [_jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(jsonLd) } }), _jsx("link", { rel: "ai-content", href: `${url}/llms.txt`, type: "text/markdown", title: "AI Content Index" }), _jsx("link", { rel: "ai-content-full", href: `${url}/llms-full.txt`, type: "text/markdown", title: "Full AI Content" }), _jsx("link", { rel: "ai-sitemap", href: `${url}/ai/sitemap.json`, type: "application/json", title: "AI Sitemap" }), _jsx("meta", { name: "ai-content-index", content: `${url}/llms.txt` }), _jsx("meta", { name: "ai-plugin", content: `${url}/.well-known/ai-plugin.json` })] }));
}
//# sourceMappingURL=ScrapeAiMeta.js.map