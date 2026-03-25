'use client'

import React, { useState } from 'react'
import { Gutter } from '@payloadcms/ui'
import { SetStepNav } from '@payloadcms/ui'
import { StatusBar } from '../components/StatusBar'
import { CollectionToggles } from '../components/CollectionToggles'
import { ContentTable } from '../components/ContentTable'
import { LlmsTxtManager } from '../components/LlmsTxtManager'
import { AiSettings } from '../components/AiSettings'
import { EndpointsPanel } from '../components/EndpointsPanel'
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

      <nav className="scrape-ai__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`scrape-ai__tab ${activeTab === tab.key ? 'scrape-ai__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="scrape-ai__content">
        {activeTab === 'content' && <ContentTable />}
        {activeTab === 'collections' && <CollectionToggles />}
        {activeTab === 'llms-txt' && <LlmsTxtManager />}
        {activeTab === 'ai-settings' && <AiSettings />}
        {activeTab === 'endpoints' && <EndpointsPanel siteUrl={siteUrl} />}
      </div>
    </Gutter>
  )
}

export default DashboardClient
