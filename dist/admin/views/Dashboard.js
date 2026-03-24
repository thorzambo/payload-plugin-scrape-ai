'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { StatusBar } from '../components/StatusBar';
import { CollectionToggles } from '../components/CollectionToggles';
import { ContentTable } from '../components/ContentTable';
import { LlmsTxtManager } from '../components/LlmsTxtManager';
import { AiSettings } from '../components/AiSettings';
import { EndpointsPanel } from '../components/EndpointsPanel';
// siteUrl is passed via the component path query or a global context
// For now, we read it from the window location
const getSiteUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return '';
};
const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('content');
    const siteUrl = getSiteUrl();
    const tabs = [
        { key: 'content', label: 'Content Entries' },
        { key: 'collections', label: 'Collections' },
        { key: 'llms-txt', label: 'llms.txt' },
        { key: 'ai-settings', label: 'AI Settings' },
        { key: 'endpoints', label: 'Endpoints' },
    ];
    return (_jsxs("div", { style: styles.container, children: [_jsxs("div", { style: styles.headerSection, children: [_jsx("h1", { style: styles.title, children: "Scrape AI" }), _jsx("p", { style: styles.subtitle, children: "AI-friendly content generation dashboard" })] }), _jsx(StatusBar, {}), _jsx("div", { style: styles.tabBar, children: tabs.map((tab) => (_jsx("button", { style: activeTab === tab.key ? styles.activeTab : styles.tab, onClick: () => setActiveTab(tab.key), children: tab.label }, tab.key))) }), _jsxs("div", { style: styles.content, children: [activeTab === 'content' && _jsx(ContentTable, {}), activeTab === 'collections' && _jsx(CollectionToggles, {}), activeTab === 'llms-txt' && _jsx(LlmsTxtManager, {}), activeTab === 'ai-settings' && _jsx(AiSettings, {}), activeTab === 'endpoints' && _jsx(EndpointsPanel, { siteUrl: siteUrl })] })] }));
};
export default Dashboard;
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