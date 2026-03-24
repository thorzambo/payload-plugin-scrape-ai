'use client'

import React, { useEffect, useState } from 'react'

interface CollectionInfo {
  slug: string
  label: string
  docCount: number
  enabled: boolean
}

export const CollectionToggles: React.FC = () => {
  const [collections, setCollections] = useState<CollectionInfo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/scrape-ai/detected-collections', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json() as any
        setCollections(data.collections || [])
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchCollections() }, [])

  const handleToggle = async (slug: string, enabled: boolean) => {
    setCollections((prev) => prev.map((c) => (c.slug === slug ? { ...c, enabled } : c)))
    await fetch('/api/scrape-ai/toggle-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ collection: slug, enabled }),
    })
  }

  if (loading) return <div>Loading collections...</div>

  return (
    <div className="scrape-ai-card">
      <h3 className="scrape-ai-card__heading">Collection Toggles</h3>
      <div className="scrape-ai-toggles">
        {collections.map((c) => (
          <div key={c.slug} className="scrape-ai-toggle-row">
            <div className="scrape-ai-toggle-row__info">
              <span className="scrape-ai-toggle-row__name">{c.label || c.slug}</span>
              <span className="scrape-ai-toggle-row__count">{c.docCount} documents</span>
            </div>
            <label className="scrape-ai-toggle-row__toggle">
              <input
                type="checkbox"
                checked={c.enabled}
                onChange={(e) => handleToggle(c.slug, e.target.checked)}
                className="scrape-ai-field__checkbox"
              />
              <span>{c.enabled ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
