'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Gutter } from '@payloadcms/ui';
import { SetStepNav } from '@payloadcms/ui';
import { StatusBar } from '../components/StatusBar';
import { CollectionToggles } from '../components/CollectionToggles';
import { ContentTable } from '../components/ContentTable';
import { LlmsTxtManager } from '../components/LlmsTxtManager';
import { AiSettings } from '../components/AiSettings';
import { EndpointsPanel } from '../components/EndpointsPanel';
import '../styles.css';
export const DashboardClient = () => {
    const [activeTab, setActiveTab] = useState('content');
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const tabs = [
        { key: 'content', label: 'Content Entries' },
        { key: 'collections', label: 'Collections' },
        { key: 'llms-txt', label: 'llms.txt' },
        { key: 'ai-settings', label: 'AI Settings' },
        { key: 'endpoints', label: 'Endpoints' },
    ];
    return (_jsxs(Gutter, { children: [_jsx(SetStepNav, { nav: [{ label: 'Scrape AI' }] }), _jsxs("header", { className: "scrape-ai__header", children: [_jsx("h1", { className: "scrape-ai__title", children: "Scrape AI" }), _jsx("p", { className: "scrape-ai__description", children: "AI-friendly content generation dashboard" })] }), _jsx(StatusBar, {}), _jsx("nav", { className: "scrape-ai__tabs", children: tabs.map((tab) => (_jsx("button", { className: `scrape-ai__tab ${activeTab === tab.key ? 'scrape-ai__tab--active' : ''}`, onClick: () => setActiveTab(tab.key), children: tab.label }, tab.key))) }), _jsxs("div", { className: "scrape-ai__content", children: [activeTab === 'content' && _jsx(ContentTable, {}), activeTab === 'collections' && _jsx(CollectionToggles, {}), activeTab === 'llms-txt' && _jsx(LlmsTxtManager, {}), activeTab === 'ai-settings' && _jsx(AiSettings, {}), activeTab === 'endpoints' && _jsx(EndpointsPanel, { siteUrl: siteUrl })] })] }));
};
export default DashboardClient;
//# sourceMappingURL=DashboardClient.js.map