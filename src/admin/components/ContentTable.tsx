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

const statusColors: Record<string, string> = {
  synced: '#22c55e',
  pending: '#eab308',
  processing: '#3b82f6',
  error: '#ef4444',
  'error-permanent': '#991b1b',
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
  const [filterStatus, setFilterStatus] = useState('')

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (filterStatus) params.set('status', filterStatus)
      const res = await fetch(`/api/scrape-ai/entries?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json() as any
        setEntries(data.docs || [])
        setTotalDocs(data.totalDocs)
        setTotalPages(data.totalPages)
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchEntries() }, [page, filterStatus])

  const handleRowClick = async (id: string) => {
    if (selectedId === id) { setSelectedId(null); setDetail(null); return }
    setSelectedId(id)
    try {
      const res = await fetch(`/api/scrape-ai/entry/${id}`, { credentials: 'include' })
      if (res.ok) setDetail(await res.json() as EntryDetail)
    } catch {}
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

  return (
    <div className="scrape-ai-card">
      <div className="scrape-ai-header-row">
        <h3 className="scrape-ai-card__heading">Content Entries ({totalDocs})</h3>
        <div className="scrape-ai-filters">
          <select
            className="scrape-ai-field__select"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            style={{ width: 'auto' }}
          >
            <option value="">All Statuses</option>
            <option value="synced">Synced</option>
            <option value="pending">Pending</option>
            <option value="error">Error</option>
            <option value="error-permanent">Permanent Error</option>
          </select>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <>
          <table className="scrape-ai-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Collection</th>
                <th>Status</th>
                <th>Last Synced</th>
                <th>AI</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => handleRowClick(entry.id)}>
                    <td>
                      {entry.title}
                      {entry.isDraft && <span className="scrape-ai-badge scrape-ai-badge--draft" style={{ marginLeft: 8 }}>DRAFT</span>}
                    </td>
                    <td>{entry.sourceCollection}</td>
                    <td>
                      <span className="scrape-ai-status-dot" style={{ backgroundColor: statusColors[entry.status] || '#999' }} />
                      {entry.status}
                    </td>
                    <td>{entry.lastSynced ? new Date(entry.lastSynced).toLocaleString() : '—'}</td>
                    <td>{entry.hasAiMeta ? 'Yes' : '—'}</td>
                    <td>
                      <button
                        className="scrape-ai-btn scrape-ai-btn--secondary scrape-ai-btn--small"
                        onClick={(e) => { e.stopPropagation(); handleRegenerate([entry.id]) }}
                      >
                        Regenerate
                      </button>
                    </td>
                  </tr>
                  {selectedId === entry.id && detail && (
                    <tr>
                      <td colSpan={6} className="scrape-ai-detail">
                        <div className="scrape-ai-detail__header">
                          <button
                            className={`scrape-ai-btn ${viewMode === 'rendered' ? 'scrape-ai-btn--primary' : 'scrape-ai-btn--secondary'} scrape-ai-btn--small`}
                            onClick={() => setViewMode('rendered')}
                          >Rendered</button>
                          <button
                            className={`scrape-ai-btn ${viewMode === 'raw' ? 'scrape-ai-btn--primary' : 'scrape-ai-btn--secondary'} scrape-ai-btn--small`}
                            onClick={() => setViewMode('raw')}
                          >Raw Markdown</button>
                        </div>
                        <pre className="scrape-ai-code">
                          {viewMode === 'raw'
                            ? (detail as any).markdown || 'No content'
                            : (detail as any).markdown?.replace(/^---[\s\S]*?---\n*/m, '') || 'No content'}
                        </pre>
                        {(detail as any).jsonLd && (
                          <details style={{ marginTop: 12 }}>
                            <summary>JSON-LD</summary>
                            <pre className="scrape-ai-code">{JSON.stringify((detail as any).jsonLd, null, 2)}</pre>
                          </details>
                        )}
                        {(detail as any).aiMeta && (
                          <details style={{ marginTop: 12 }}>
                            <summary>AI Metadata</summary>
                            <pre className="scrape-ai-code">{JSON.stringify((detail as any).aiMeta, null, 2)}</pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          <div className="scrape-ai-pagination">
            <button className="scrape-ai-btn scrape-ai-btn--secondary scrape-ai-btn--small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span className="scrape-ai-pagination__info">Page {page} of {totalPages}</span>
            <button className="scrape-ai-btn scrape-ai-btn--secondary scrape-ai-btn--small" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  )
}
