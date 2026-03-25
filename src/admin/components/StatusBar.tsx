'use client'

import React, { useEffect, useState } from 'react'
import { Banner, Button, Pill } from '@payloadcms/ui'

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
      // Poll aggressively until entries reappear (sync runs on scheduler tick)
      let attempts = 0
      const pollUntilReady = setInterval(async () => {
        attempts++
        const res = await fetch('/api/scrape-ai/status', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json() as StatusData
          setStatus(data)
          if (data.totalEntries > 0 || attempts >= 30) {
            clearInterval(pollUntilReady)
            setRegenerating(false)
          }
        }
      }, 2000)
    } catch {
      setRegenerating(false)
    }
  }

  if (loading) return <Banner type="default">Loading...</Banner>
  if (!status) return <Banner type="error">Failed to load status</Banner>

  const bannerType = regenerating ? 'info'
    : status.errorCount > 0 ? 'error'
    : status.pendingCount > 0 ? 'info'
    : 'success' as const

  const statusText = regenerating ? 'Regenerating...'
    : status.errorCount > 0 ? `${status.errorCount} Errors`
    : status.pendingCount > 0 ? `${status.pendingCount} Pending`
    : 'All Synced'
  const collectionCount = Object.keys(status.collections).length

  return (
    <Banner type={bannerType}>
      <div className="scrape-ai-status__row">
        <div className="scrape-ai-status__group">
          <Pill pillStyle={status.errorCount > 0 ? 'error' : status.pendingCount > 0 ? 'warning' : 'success'}>
            {statusText}
          </Pill>
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
            <Pill pillStyle="dark">AI: {status.aiApiCallCount} calls</Pill>
          )}
          <Button type="button" buttonStyle="primary" size="small" onClick={handleRegenerateAll} disabled={regenerating}>
            {regenerating ? 'Regenerating...' : 'Regenerate All'}
          </Button>
        </div>
      </div>
    </Banner>
  )
}
