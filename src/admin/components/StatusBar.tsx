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

  if (loading) return <div style={styles.container}>Loading...</div>
  if (!status) return <div style={styles.container}>Failed to load status</div>

  const statusColor =
    status.errorCount > 0 ? '#ef4444' : status.pendingCount > 0 ? '#eab308' : '#22c55e'
  const statusText =
    status.errorCount > 0
      ? `${status.errorCount} Errors`
      : status.pendingCount > 0
        ? `${status.pendingCount} Pending`
        : 'All Synced'

  const collectionCount = Object.keys(status.collections).length

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <div style={styles.statusGroup}>
          <span style={{ ...styles.pill, backgroundColor: statusColor }}>{statusText}</span>
          <span style={styles.stat}>
            {status.totalEntries} pages across {collectionCount} collections
          </span>
        </div>

        <div style={styles.rightGroup}>
          {status.lastRebuild && (
            <span style={styles.timestamp}>
              Last rebuild: {new Date(status.lastRebuild).toLocaleString()}
            </span>
          )}
          {status.aiEnabled && (
            <span style={styles.aiPill}>AI: {status.aiApiCallCount} calls</span>
          )}
          <button
            style={styles.button}
            onClick={handleRegenerateAll}
            disabled={regenerating}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate All'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px 24px',
    backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
    borderBottom: '1px solid var(--theme-elevation-100, #e0e0e0)',
    marginBottom: '24px',
    borderRadius: '8px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  statusGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pill: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '13px',
    fontWeight: 600,
  },
  aiPill: {
    padding: '4px 12px',
    borderRadius: '12px',
    backgroundColor: '#8b5cf6',
    color: 'white',
    fontSize: '12px',
  },
  stat: {
    fontSize: '14px',
    color: 'var(--theme-elevation-600, #666)',
  },
  timestamp: {
    fontSize: '12px',
    color: 'var(--theme-elevation-400, #999)',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
}
