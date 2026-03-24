'use client'

import React, { useEffect, useState } from 'react'

interface StatusData {
  totalEntries: number
  pendingCount: number
  errorCount: number
  collections: Record<string, number>
  lastRebuild: string | null
  aiEnabled: boolean
  aiApiCallCount: number
}

export const StatusBar: React.FC = () => {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/scrape-ai/status', { credentials: 'include' })
      if (res.ok) setStatus(await res.json() as StatusData)
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleRegenerateAll = async () => {
    setRegenerating(true)
    try {
      await fetch('/api/scrape-ai/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ all: true }),
      })
      await fetchStatus()
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) return <div className="scrape-ai-status">Loading...</div>
  if (!status) return <div className="scrape-ai-status">Failed to load status</div>

  const pillClass = status.errorCount > 0 ? 'scrape-ai-pill--error'
    : status.pendingCount > 0 ? 'scrape-ai-pill--warning'
    : 'scrape-ai-pill--success'
  const statusText = status.errorCount > 0 ? `${status.errorCount} Errors`
    : status.pendingCount > 0 ? `${status.pendingCount} Pending`
    : 'All Synced'
  const collectionCount = Object.keys(status.collections).length

  return (
    <div className="scrape-ai-status">
      <div className="scrape-ai-status__row">
        <div className="scrape-ai-status__group">
          <span className={`scrape-ai-pill ${pillClass}`}>{statusText}</span>
          <span className="scrape-ai-status__stat">
            {status.totalEntries} pages across {collectionCount} collections
          </span>
        </div>
        <div className="scrape-ai-status__group">
          {status.lastRebuild && (
            <span className="scrape-ai-status__timestamp">
              Last rebuild: {new Date(status.lastRebuild).toLocaleString()}
            </span>
          )}
          {status.aiEnabled && (
            <span className="scrape-ai-pill scrape-ai-pill--info">AI: {status.aiApiCallCount} calls</span>
          )}
          <button className="scrape-ai-btn scrape-ai-btn--primary" onClick={handleRegenerateAll} disabled={regenerating}>
            {regenerating ? 'Regenerating...' : 'Regenerate All'}
          </button>
        </div>
      </div>
    </div>
  )
}
