import React from 'react';
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
                urlTemplate: `${url}/ai/context?query={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
        },
        // Non-standard but parseable: advertise AI content
        additionalProperty: [
            {
                '@type': 'PropertyValue',
                name: 'ai-content-index',
                value: `${url}/llms.txt`
            },
            {
                '@type': 'PropertyValue',
                name: 'ai-content-full',
                value: `${url}/llms-full.txt`
            },
            {
                '@type': 'PropertyValue',
                name: 'ai-discovery-manifest',
                value: `${url}/.well-known/ai-plugin.json`
            }
        ]
    };
    return /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("script", {
        type: "application/ld+json",
        dangerouslySetInnerHTML: {
            __html: JSON.stringify(jsonLd)
        }
    }), /*#__PURE__*/ React.createElement("link", {
        rel: "ai-content",
        href: `${url}/llms.txt`,
        type: "text/markdown",
        title: "AI Content Index"
    }), /*#__PURE__*/ React.createElement("link", {
        rel: "ai-content-full",
        href: `${url}/llms-full.txt`,
        type: "text/markdown",
        title: "Full AI Content"
    }), /*#__PURE__*/ React.createElement("link", {
        rel: "ai-sitemap",
        href: `${url}/ai/sitemap.json`,
        type: "application/json",
        title: "AI Sitemap"
    }), /*#__PURE__*/ React.createElement("meta", {
        name: "ai-content-index",
        content: `${url}/llms.txt`
    }), /*#__PURE__*/ React.createElement("meta", {
        name: "ai-plugin",
        content: `${url}/.well-known/ai-plugin.json`
    }));
}

//# sourceMappingURL=ScrapeAiMeta.js.map