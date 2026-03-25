'use client';
import React, { useState } from 'react';
import { Button, Gutter } from '@payloadcms/ui';
import { SetStepNav } from '@payloadcms/ui';
import { StatusBar } from '../components/StatusBar';
import { CollectionToggles } from '../components/CollectionToggles';
import { ContentTable } from '../components/ContentTable';
import { LlmsTxtManager } from '../components/LlmsTxtManager';
import { AiSettings } from '../components/AiSettings';
import { EndpointsPanel } from '../components/EndpointsPanel';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../styles.css';
export const DashboardClient = ()=>{
    const [activeTab, setActiveTab] = useState('content');
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const tabs = [
        {
            key: 'content',
            label: 'Content Entries'
        },
        {
            key: 'collections',
            label: 'Collections'
        },
        {
            key: 'llms-txt',
            label: 'llms.txt'
        },
        {
            key: 'ai-settings',
            label: 'AI Settings'
        },
        {
            key: 'endpoints',
            label: 'Endpoints'
        }
    ];
    return /*#__PURE__*/ React.createElement(Gutter, null, /*#__PURE__*/ React.createElement(SetStepNav, {
        nav: [
            {
                label: 'Scrape AI'
            }
        ]
    }), /*#__PURE__*/ React.createElement("header", {
        className: "scrape-ai__header"
    }, /*#__PURE__*/ React.createElement("h1", {
        className: "scrape-ai__title"
    }, "Scrape AI"), /*#__PURE__*/ React.createElement("p", {
        className: "scrape-ai__description"
    }, "AI-friendly content generation dashboard")), /*#__PURE__*/ React.createElement(StatusBar, null), /*#__PURE__*/ React.createElement("nav", {
        className: "default-list-view-tabs scrape-ai__tabs"
    }, tabs.map((tab)=>/*#__PURE__*/ React.createElement(Button, {
            key: tab.key,
            buttonStyle: "tab",
            el: "button",
            disabled: activeTab === tab.key,
            onClick: ()=>setActiveTab(tab.key)
        }, tab.label))), /*#__PURE__*/ React.createElement("div", {
        className: "scrape-ai__content"
    }, activeTab === 'content' && /*#__PURE__*/ React.createElement(ErrorBoundary, {
        fallbackLabel: "Content table failed to load"
    }, /*#__PURE__*/ React.createElement(ContentTable, null)), activeTab === 'collections' && /*#__PURE__*/ React.createElement(ErrorBoundary, {
        fallbackLabel: "Collections failed to load"
    }, /*#__PURE__*/ React.createElement(CollectionToggles, null)), activeTab === 'llms-txt' && /*#__PURE__*/ React.createElement(ErrorBoundary, {
        fallbackLabel: "llms.txt manager failed to load"
    }, /*#__PURE__*/ React.createElement(LlmsTxtManager, null)), activeTab === 'ai-settings' && /*#__PURE__*/ React.createElement(ErrorBoundary, {
        fallbackLabel: "AI settings failed to load"
    }, /*#__PURE__*/ React.createElement(AiSettings, null)), activeTab === 'endpoints' && /*#__PURE__*/ React.createElement(ErrorBoundary, {
        fallbackLabel: "Endpoints panel failed to load"
    }, /*#__PURE__*/ React.createElement(EndpointsPanel, {
        siteUrl: siteUrl
    }))));
};
export default DashboardClient;

//# sourceMappingURL=DashboardClient.js.map