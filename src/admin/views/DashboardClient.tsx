'use client'

import React, { useState } from 'react'
import { Button, Gutter } from '@payloadcms/ui'
import { SetStepNav } from '@payloadcms/ui'
import { StatusBar } from '../components/StatusBar'
import { CollectionToggles } from '../components/CollectionToggles'
import { ContentTable } from '../components/ContentTable'
import { LlmsTxtManager } from '../components/LlmsTxtManager'
import { AiSettings } from '../components/AiSettings'
import { EndpointsPanel } from '../components/EndpointsPanel'
import { ErrorBoundary } from '../components/ErrorBoundary'
import '../styles.css'

type Tab = 'content' | 'collections' | 'llms-txt' | 'ai-settings' | 'endpoints'

export const DashboardClient: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('content')
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const tabs: { key: Tab; label: string }[] = [
    { key: 'content', label: 'Content Entries' },
    { key: 'collections', label: 'Collections' },
    { key: 'llms-txt', label: 'llms.txt' },
    { key: 'ai-settings', label: 'AI Settings' },
    { key: 'endpoints', label: 'Endpoints' },
  ]

  return (
    <Gutter>
      <SetStepNav nav={[{ label: 'Scrape AI' }]} />

      <header className="scrape-ai__header">
        <h1 className="scrape-ai__title">Scrape AI</h1>
        <p className="scrape-ai__description">AI-friendly content generation dashboard</p>
      </header>

      <StatusBar />

      {/*
        R2 — Tab navigation uses Payload's native Button component with buttonStyle="tab".
        The active tab is rendered with disabled={true} to match Payload's own
        DefaultListViewTabs pattern (btn--disabled produces the active/selected style
        via --btn-font-weight: 600 and --bg-color: var(--theme-elevation-100)).
        The container reuses .default-list-view-tabs from @payloadcms/ui for consistent spacing.
        TabComponent from @payloadcms/ui is not usable here — it requires a ClientTab
        (Payload field config object) and form-level callbacks, not simple string labels.
      */}
      <nav className="default-list-view-tabs scrape-ai__tabs">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            buttonStyle="tab"
            el="button"
            disabled={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </nav>

      <div className="scrape-ai__content">
        {activeTab === 'content' && (
          <ErrorBoundary fallbackLabel="Content table failed to load">
            <ContentTable />
          </ErrorBoundary>
        )}
        {activeTab === 'collections' && (
          <ErrorBoundary fallbackLabel="Collections failed to load">
            <CollectionToggles />
          </ErrorBoundary>
        )}
        {activeTab === 'llms-txt' && (
          <ErrorBoundary fallbackLabel="llms.txt manager failed to load">
            <LlmsTxtManager />
          </ErrorBoundary>
        )}
        {activeTab === 'ai-settings' && (
          <ErrorBoundary fallbackLabel="AI settings failed to load">
            <AiSettings />
          </ErrorBoundary>
        )}
        {activeTab === 'endpoints' && (
          <ErrorBoundary fallbackLabel="Endpoints panel failed to load">
            <EndpointsPanel siteUrl={siteUrl} />
          </ErrorBoundary>
        )}
      </div>
    </Gutter>
  )
}

export default DashboardClient
