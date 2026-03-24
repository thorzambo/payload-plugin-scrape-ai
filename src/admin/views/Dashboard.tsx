'use client'

import React, { useState } from 'react'
import { StatusBar } from '../components/StatusBar'
import { CollectionToggles } from '../components/CollectionToggles'
import { ContentTable } from '../components/ContentTable'
import { LlmsTxtManager } from '../components/LlmsTxtManager'
import { AiSettings } from '../components/AiSettings'
import { EndpointsPanel } from '../components/EndpointsPanel'

type Tab = 'content' | 'collections' | 'llms-txt' | 'ai-settings' | 'endpoints'

// siteUrl is passed via the component path query or a global context
// For now, we read it from the window location
const getSiteUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('content')
  const siteUrl = getSiteUrl()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'content', label: 'Content Entries' },
    { key: 'collections', label: 'Collections' },
    { key: 'llms-txt', label: 'llms.txt' },
    { key: 'ai-settings', label: 'AI Settings' },
    { key: 'endpoints', label: 'Endpoints' },
  ]

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <h1 style={styles.title}>Scrape AI</h1>
        <p style={styles.subtitle}>AI-friendly content generation dashboard</p>
      </div>

      <StatusBar />

      <div style={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={activeTab === tab.key ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'content' && <ContentTable />}
        {activeTab === 'collections' && <CollectionToggles />}
        {activeTab === 'llms-txt' && <LlmsTxtManager />}
        {activeTab === 'ai-settings' && <AiSettings />}
        {activeTab === 'endpoints' && <EndpointsPanel siteUrl={siteUrl} />}
      </div>
    </div>
  )
}

export default Dashboard

const styles: Record<string, React.CSSProperties> = {
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
}
