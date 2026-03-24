'use client'

import React, { useEffect, useState } from 'react'

interface Entry {
  id: string
  title: string
  slug: string
  sourceCollection: string
  status: string
  lastSynced: string
  hasAiMeta: boolean
  isDraft: boolean
  errorMessage?: string
}

interface EntryDetail {
  markdown?: string
  jsonLd?: any
  aiMeta?: any
}

export const ContentTable: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<EntryDetail | null>(null)
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered')
  const [filterCollection, setFilterCollection] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (filterCollection) params.set('collection', filterCollection)
      if (filterStatus) params.set('status', filterStatus)

      const res = await fetch(`/api/scrape-ai/entries?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json() as any
        setEntries(data.docs || [])
        setTotalDocs(data.totalDocs)
        setTotalPages(data.totalPages)
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [page, filterCollection, filterStatus])

  const handleRowClick = async (id: string) => {
    if (selectedId === id) {
      setSelectedId(null)
      setDetail(null)
      return
    }
    setSelectedId(id)
    try {
      const res = await fetch(`/api/scrape-ai/entry/${id}`, { credentials: 'include' })
      if (res.ok) setDetail(await res.json() as EntryDetail)
    } catch {
      // Silent fail
    }
  }

  const handleRegenerate = async (ids: string[]) => {
    await fetch('/api/scrape-ai/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids }),
    })
    await fetchEntries()
  }

  const statusColors: Record<string, string> = {
    synced: '#22c55e',
    pending: '#eab308',
    processing: '#3b82f6',
    error: '#ef4444',
    'error-permanent': '#991b1b',
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.heading}>Content Entries ({totalDocs})</h3>
        <div style={styles.filters}>
          <select
            style={styles.select}
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          >
            <option value="">All Statuses</option>
            <option value="synced">Synced</option>
            <option value="pending">Pending</option>
            <option value="error">Error</option>
            <option value="error-permanent">Permanent Error</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Collection</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Last Synced</th>
                <th style={styles.th}>AI</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr
                    style={{ ...styles.tr, cursor: 'pointer' }}
                    onClick={() => handleRowClick(entry.id)}
                  >
                    <td style={styles.td}>
                      {entry.title}
                      {entry.isDraft && <span style={styles.draftBadge}>DRAFT</span>}
                    </td>
                    <td style={styles.td}>{entry.sourceCollection}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusDot,
                          backgroundColor: statusColors[entry.status] || '#999',
                        }}
                      />
                      {entry.status}
                    </td>
                    <td style={styles.td}>
                      {entry.lastSynced ? new Date(entry.lastSynced).toLocaleString() : '—'}
                    </td>
                    <td style={styles.td}>{entry.hasAiMeta ? 'Yes' : '—'}</td>
                    <td style={styles.td}>
                      <button
                        style={styles.smallButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRegenerate([entry.id])
                        }}
                      >
                        Regenerate
                      </button>
                    </td>
                  </tr>
                  {selectedId === entry.id && detail && (
                    <tr>
                      <td colSpan={6} style={styles.detailPane}>
                        <div style={styles.detailHeader}>
                          <button
                            style={viewMode === 'rendered' ? styles.activeTab : styles.tab}
                            onClick={() => setViewMode('rendered')}
                          >
                            Rendered
                          </button>
                          <button
                            style={viewMode === 'raw' ? styles.activeTab : styles.tab}
                            onClick={() => setViewMode('raw')}
                          >
                            Raw Markdown
                          </button>
                        </div>
                        <pre style={styles.codeBlock}>
                          {viewMode === 'raw'
                            ? (detail as any).markdown || 'No content'
                            : (detail as any).markdown?.replace(/^---[\s\S]*?---\n*/m, '') || 'No content'}
                        </pre>
                        {(detail as any).jsonLd && (
                          <details style={styles.details}>
                            <summary>JSON-LD</summary>
                            <pre style={styles.codeBlock}>
                              {JSON.stringify((detail as any).jsonLd, null, 2)}
                            </pre>
                          </details>
                        )}
                        {(detail as any).aiMeta && (
                          <details style={styles.details}>
                            <summary>AI Metadata</summary>
                            <pre style={styles.codeBlock}>
                              {JSON.stringify((detail as any).aiMeta, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          <div style={styles.pagination}>
            <button
              style={styles.pageButton}
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span style={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button
              style={styles.pageButton}
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  heading: { margin: 0, fontSize: '16px', fontWeight: 600 },
  filters: { display: 'flex', gap: '8px' },
  select: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid var(--theme-elevation-200, #ddd)',
    fontSize: '13px',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    borderBottom: '2px solid var(--theme-elevation-100, #e0e0e0)',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: 'var(--theme-elevation-500, #888)',
  },
  tr: { borderBottom: '1px solid var(--theme-elevation-50, #f0f0f0)' },
  td: { padding: '10px 12px', fontSize: '14px' },
  statusDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: '6px',
  },
  draftBadge: {
    marginLeft: '8px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: '10px',
    fontWeight: 600,
  },
  smallButton: {
    padding: '4px 10px',
    fontSize: '12px',
    borderRadius: '4px',
    border: '1px solid var(--theme-elevation-200, #ddd)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  detailPane: {
    padding: '16px',
    backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
  },
  detailHeader: { display: 'flex', gap: '8px', marginBottom: '12px' },
  tab: {
    padding: '6px 14px',
    fontSize: '12px',
    border: '1px solid var(--theme-elevation-200, #ddd)',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  activeTab: {
    padding: '6px 14px',
    fontSize: '12px',
    border: '1px solid var(--theme-elevation-900, #333)',
    borderRadius: '4px',
    backgroundColor: 'var(--theme-elevation-900, #333)',
    color: 'white',
    cursor: 'pointer',
  },
  codeBlock: {
    padding: '12px',
    backgroundColor: 'var(--theme-elevation-100, #f0f0f0)',
    borderRadius: '6px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '400px',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  details: { marginTop: '12px' },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginTop: '16px',
  },
  pageButton: {
    padding: '6px 14px',
    fontSize: '13px',
    borderRadius: '4px',
    border: '1px solid var(--theme-elevation-200, #ddd)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  pageInfo: { fontSize: '13px', color: 'var(--theme-elevation-500, #888)' },
}
