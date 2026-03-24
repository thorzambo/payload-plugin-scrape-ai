"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const StatusBar_1 = require("../components/StatusBar");
const CollectionToggles_1 = require("../components/CollectionToggles");
const ContentTable_1 = require("../components/ContentTable");
const LlmsTxtManager_1 = require("../components/LlmsTxtManager");
const AiSettings_1 = require("../components/AiSettings");
const EndpointsPanel_1 = require("../components/EndpointsPanel");
// siteUrl is passed via the component path query or a global context
// For now, we read it from the window location
const getSiteUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return '';
};
const Dashboard = () => {
    const [activeTab, setActiveTab] = (0, react_1.useState)('content');
    const siteUrl = getSiteUrl();
    const tabs = [
        { key: 'content', label: 'Content Entries' },
        { key: 'collections', label: 'Collections' },
        { key: 'llms-txt', label: 'llms.txt' },
        { key: 'ai-settings', label: 'AI Settings' },
        { key: 'endpoints', label: 'Endpoints' },
    ];
    return ((0, jsx_runtime_1.jsxs)("div", { style: styles.container, children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.headerSection, children: [(0, jsx_runtime_1.jsx)("h1", { style: styles.title, children: "Scrape AI" }), (0, jsx_runtime_1.jsx)("p", { style: styles.subtitle, children: "AI-friendly content generation dashboard" })] }), (0, jsx_runtime_1.jsx)(StatusBar_1.StatusBar, {}), (0, jsx_runtime_1.jsx)("div", { style: styles.tabBar, children: tabs.map((tab) => ((0, jsx_runtime_1.jsx)("button", { style: activeTab === tab.key ? styles.activeTab : styles.tab, onClick: () => setActiveTab(tab.key), children: tab.label }, tab.key))) }), (0, jsx_runtime_1.jsxs)("div", { style: styles.content, children: [activeTab === 'content' && (0, jsx_runtime_1.jsx)(ContentTable_1.ContentTable, {}), activeTab === 'collections' && (0, jsx_runtime_1.jsx)(CollectionToggles_1.CollectionToggles, {}), activeTab === 'llms-txt' && (0, jsx_runtime_1.jsx)(LlmsTxtManager_1.LlmsTxtManager, {}), activeTab === 'ai-settings' && (0, jsx_runtime_1.jsx)(AiSettings_1.AiSettings, {}), activeTab === 'endpoints' && (0, jsx_runtime_1.jsx)(EndpointsPanel_1.EndpointsPanel, { siteUrl: siteUrl })] })] }));
};
exports.default = Dashboard;
const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px',
    },
    headerSection: {
        marginBottom: '24px',
    },
    title: {
        margin: '0 0 4px 0',
        fontSize: '28px',
        fontWeight: 700,
    },
    subtitle: {
        margin: 0,
        fontSize: '14px',
        color: 'var(--theme-elevation-500, #888)',
    },
    tabBar: {
        display: 'flex',
        gap: '4px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--theme-elevation-100, #e0e0e0)',
        paddingBottom: '0px',
    },
    tab: {
        padding: '10px 20px',
        fontSize: '14px',
        border: 'none',
        borderBottom: '2px solid transparent',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        color: 'var(--theme-elevation-500, #888)',
        fontWeight: 500,
    },
    activeTab: {
        padding: '10px 20px',
        fontSize: '14px',
        border: 'none',
        borderBottom: '2px solid var(--theme-elevation-900, #333)',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        color: 'var(--theme-elevation-900, #333)',
        fontWeight: 600,
    },
    content: {
        minHeight: '400px',
    },
};
//# sourceMappingURL=Dashboard.js.map