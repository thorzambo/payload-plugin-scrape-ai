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
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [])

  const handleToggle = async (slug: string, enabled: boolean) => {
    // Optimistic update
    setCollections((prev) =>
      prev.map((c) => (c.slug === slug ? { ...c, enabled } : c)),
    )

    await fetch('/api/scrape-ai/toggle-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ collection: slug, enabled }),
    })
  }

  if (loading) return <div>Loading collections...</div>

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Collection Toggles</h3>
      <div style={styles.list}>
        {collections.map((c) => (
          <div key={c.slug} style={styles.row}>
            <div style={styles.info}>
              <span style={styles.name}>{c.label || c.slug}</span>
              <span style={styles.count}>{c.docCount} documents</span>
            </div>
            <label style={styles.toggle}>
              <input
                type="checkbox"
                checked={c.enabled}
                onChange={(e) => handleToggle(c.slug, e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.toggleLabel}>{c.enabled ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    backgroundColor: 'var(--theme-elevation-0, white)',
    borderRadius: '8px',
    border: '1px solid var(--theme-elevation-100, #e0e0e0)',
  },
  heading: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 600,
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
    borderRadius: '6px',
  },
  info: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  name: {
    fontSize: '14px',
    fontWeight: 500,
  },
  count: {
    fontSize: '12px',
    color: 'var(--theme-elevation-400, #999)',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  toggleLabel: {
    fontSize: '13px',
  },
}
