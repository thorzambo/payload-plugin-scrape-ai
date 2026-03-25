'use client';
import React, { useState } from 'react';
import { Button, CopyToClipboard } from '@payloadcms/ui';
export const EndpointsPanel = ({ siteUrl })=>{
    const [testingEndpoint, setTestingEndpoint] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const endpoints = [
        {
            path: '/api/llms.txt',
            method: 'GET',
            description: 'Curated AI-friendly index'
        },
        {
            path: '/api/llms-full.txt',
            method: 'GET',
            description: 'Comprehensive content listing'
        },
        {
            path: '/api/ai/sitemap.json',
            method: 'GET',
            description: 'Content relationships & hierarchy'
        },
        {
            path: '/api/ai/context?query=example',
            method: 'GET',
            description: 'Context query for AI agents'
        },
        {
            path: '/api/ai/{collection}/{slug}.md',
            method: 'GET',
            description: 'Individual page markdown'
        },
        {
            path: '/api/ai/structured/{collection}/{slug}.json',
            method: 'GET',
            description: 'JSON-LD structured data'
        }
    ];
    const handleTest = async (path)=>{
        setTestingEndpoint(path);
        setTestResult(null);
        try {
            const res = await fetch(`/api${path.replace('/api', '')}`);
            const contentType = res.headers.get('content-type') || '';
            let body;
            if (contentType.includes('json')) {
                body = JSON.stringify(await res.json(), null, 2);
            } else {
                body = await res.text();
            }
            setTestResult(body.slice(0, 2000));
        } catch (e) {
            setTestResult(`Error: ${e.message}`);
        } finally{
            setTestingEndpoint(null);
        }
    };
    return(// R3: Custom card container — Payload's Card component is a clickable navigation
    // card (title + optional action) and does not support arbitrary children content.
    // Styled via .scrape-ai-card using only Payload CSS tokens for theme adaptation.
    /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-card"
    }, /*#__PURE__*/ React.createElement("h3", {
        className: "scrape-ai-card__heading"
    }, "Endpoints & Access"), /*#__PURE__*/ React.createElement("div", null, endpoints.map((ep)=>/*#__PURE__*/ React.createElement("div", {
            key: ep.path,
            className: "scrape-ai-endpoint"
        }, /*#__PURE__*/ React.createElement("div", {
            className: "scrape-ai-endpoint__info"
        }, /*#__PURE__*/ React.createElement("code", {
            className: "scrape-ai-endpoint__path"
        }, ep.method, " ", ep.path), /*#__PURE__*/ React.createElement("span", {
            className: "scrape-ai-endpoint__description"
        }, ep.description)), /*#__PURE__*/ React.createElement("div", {
            className: "scrape-ai-endpoint__actions"
        }, /*#__PURE__*/ React.createElement(CopyToClipboard, {
            value: `${siteUrl}${ep.path}`,
            defaultMessage: "Copy URL",
            successMessage: "Copied!"
        }), !ep.path.includes('{') && /*#__PURE__*/ React.createElement(Button, {
            type: "button",
            buttonStyle: "secondary",
            size: "small",
            onClick: ()=>handleTest(ep.path),
            disabled: testingEndpoint === ep.path
        }, testingEndpoint === ep.path ? 'Testing...' : 'Test'))))), testResult && /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-mt-16"
    }, /*#__PURE__*/ React.createElement("h4", {
        className: "scrape-ai-card__subheading"
    }, "Response"), /*#__PURE__*/ React.createElement("pre", {
        className: "scrape-ai-code"
    }, testResult)), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai-guide"
    }, /*#__PURE__*/ React.createElement("h4", {
        className: "scrape-ai-card__subheading scrape-ai-subheading--compact"
    }, "Integration Guide"), /*#__PURE__*/ React.createElement("p", {
        className: "scrape-ai-guide__text"
    }, "Point AI agents to ", /*#__PURE__*/ React.createElement("code", null, siteUrl, "/api/llms.txt"), " as the entry point. The llms.txt file links to all available content in markdown format."), /*#__PURE__*/ React.createElement("p", {
        className: "scrape-ai-guide__text"
    }, "For programmatic access, use the ", /*#__PURE__*/ React.createElement("code", null, "/api/ai/context?query=..."), " endpoint to search content by relevance."))));
};

//# sourceMappingURL=EndpointsPanel.js.map