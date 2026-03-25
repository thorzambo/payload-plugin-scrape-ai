'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button, CopyToClipboard } from '@payloadcms/ui';
export const EndpointsPanel = ({ siteUrl }) => {
    const [testingEndpoint, setTestingEndpoint] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const endpoints = [
        { path: '/api/llms.txt', method: 'GET', description: 'Curated AI-friendly index' },
        { path: '/api/llms-full.txt', method: 'GET', description: 'Comprehensive content listing' },
        { path: '/api/ai/sitemap.json', method: 'GET', description: 'Content relationships & hierarchy' },
        { path: '/api/ai/context?query=example', method: 'GET', description: 'Context query for AI agents' },
        { path: '/api/ai/{collection}/{slug}.md', method: 'GET', description: 'Individual page markdown' },
        {
            path: '/api/ai/structured/{collection}/{slug}.json',
            method: 'GET',
            description: 'JSON-LD structured data',
        },
    ];
    const handleTest = async (path) => {
        setTestingEndpoint(path);
        setTestResult(null);
        try {
            const res = await fetch(`/api${path.replace('/api', '')}`);
            const contentType = res.headers.get('content-type') || '';
            let body;
            if (contentType.includes('json')) {
                body = JSON.stringify(await res.json(), null, 2);
            }
            else {
                body = await res.text();
            }
            setTestResult(body.slice(0, 2000));
        }
        catch (e) {
            setTestResult(`Error: ${e.message}`);
        }
        finally {
            setTestingEndpoint(null);
        }
    };
    return (_jsxs("div", { className: "scrape-ai-card", children: [_jsx("h3", { className: "scrape-ai-card__heading", children: "Endpoints & Access" }), _jsx("div", { children: endpoints.map((ep) => (_jsxs("div", { className: "scrape-ai-endpoint", children: [_jsxs("div", { className: "scrape-ai-endpoint__info", children: [_jsxs("code", { className: "scrape-ai-endpoint__path", children: [ep.method, " ", ep.path] }), _jsx("span", { className: "scrape-ai-endpoint__description", children: ep.description })] }), _jsxs("div", { className: "scrape-ai-endpoint__actions", children: [_jsx(CopyToClipboard, { value: `${siteUrl}${ep.path}`, defaultMessage: "Copy URL", successMessage: "Copied!" }), !ep.path.includes('{') && (_jsx(Button, { type: "button", buttonStyle: "secondary", size: "small", onClick: () => handleTest(ep.path), disabled: testingEndpoint === ep.path, children: testingEndpoint === ep.path ? 'Testing...' : 'Test' }))] })] }, ep.path))) }), testResult && (_jsxs("div", { className: "scrape-ai-mt-16", children: [_jsx("h4", { className: "scrape-ai-card__subheading", children: "Response" }), _jsx("pre", { className: "scrape-ai-code", children: testResult })] })), _jsxs("div", { className: "scrape-ai-guide", children: [_jsx("h4", { className: "scrape-ai-card__subheading scrape-ai-subheading--compact", children: "Integration Guide" }), _jsxs("p", { className: "scrape-ai-guide__text", children: ["Point AI agents to ", _jsxs("code", { children: [siteUrl, "/api/llms.txt"] }), " as the entry point. The llms.txt file links to all available content in markdown format."] }), _jsxs("p", { className: "scrape-ai-guide__text", children: ["For programmatic access, use the ", _jsx("code", { children: "/api/ai/context?query=..." }), " endpoint to search content by relevance."] })] })] }));
};
//# sourceMappingURL=EndpointsPanel.js.map