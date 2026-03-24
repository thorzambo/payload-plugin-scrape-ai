'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export const EndpointsPanel = ({ siteUrl }) => {
    const [testingEndpoint, setTestingEndpoint] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [copied, setCopied] = useState(null);
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
    const handleCopy = async (path) => {
        const url = `${siteUrl}${path}`;
        await navigator.clipboard.writeText(url);
        setCopied(path);
        setTimeout(() => setCopied(null), 2000);
    };
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
    return (_jsxs("div", { style: styles.container, children: [_jsx("h3", { style: styles.heading, children: "Endpoints & Access" }), _jsx("div", { style: styles.list, children: endpoints.map((ep) => (_jsxs("div", { style: styles.row, children: [_jsxs("div", { style: styles.info, children: [_jsxs("code", { style: styles.path, children: [ep.method, " ", ep.path] }), _jsx("span", { style: styles.description, children: ep.description })] }), _jsxs("div", { style: styles.actions, children: [_jsx("button", { style: styles.button, onClick: () => handleCopy(ep.path), children: copied === ep.path ? 'Copied!' : 'Copy URL' }), !ep.path.includes('{') && (_jsx("button", { style: styles.button, onClick: () => handleTest(ep.path), disabled: testingEndpoint === ep.path, children: testingEndpoint === ep.path ? 'Testing...' : 'Test' }))] })] }, ep.path))) }), testResult && (_jsxs("div", { style: styles.testOutput, children: [_jsx("h4", { style: styles.subheading, children: "Response" }), _jsx("pre", { style: styles.codeBlock, children: testResult })] })), _jsxs("div", { style: styles.instructions, children: [_jsx("h4", { style: styles.subheading, children: "Integration Guide" }), _jsxs("p", { style: styles.text, children: ["Point AI agents to ", _jsxs("code", { children: [siteUrl, "/api/llms.txt"] }), " as the entry point. The llms.txt file links to all available content in markdown format."] }), _jsxs("p", { style: styles.text, children: ["For programmatic access, use the ", _jsx("code", { children: "/api/ai/context?query=..." }), " endpoint to search content by relevance."] })] })] }));
};
const styles = {
    container: {
        padding: '20px',
        backgroundColor: 'var(--theme-elevation-0, white)',
        borderRadius: '8px',
        border: '1px solid var(--theme-elevation-100, #e0e0e0)',
    },
    heading: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 },
    subheading: { margin: '12px 0 8px 0', fontSize: '14px', fontWeight: 500 },
    list: { display: 'flex', flexDirection: 'column', gap: '8px' },
    row: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
        borderRadius: '6px',
        flexWrap: 'wrap',
        gap: '8px',
    },
    info: { display: 'flex', flexDirection: 'column', gap: '2px' },
    path: { fontSize: '13px', fontFamily: 'monospace', fontWeight: 500 },
    description: { fontSize: '12px', color: 'var(--theme-elevation-400, #999)' },
    actions: { display: 'flex', gap: '6px' },
    button: {
        padding: '4px 10px',
        fontSize: '12px',
        borderRadius: '4px',
        border: '1px solid var(--theme-elevation-200, #ddd)',
        backgroundColor: 'transparent',
        cursor: 'pointer',
    },
    testOutput: { marginTop: '16px' },
    codeBlock: {
        padding: '12px',
        backgroundColor: 'var(--theme-elevation-100, #f0f0f0)',
        borderRadius: '6px',
        fontSize: '12px',
        overflow: 'auto',
        maxHeight: '300px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
    },
    instructions: {
        marginTop: '20px',
        padding: '16px',
        backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
        borderRadius: '6px',
    },
    text: { fontSize: '13px', margin: '4px 0', lineHeight: '1.5' },
};
//# sourceMappingURL=EndpointsPanel.js.map