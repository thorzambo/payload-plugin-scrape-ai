'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@payloadcms/ui'
import { Pagination } from '@payloadcms/ui'
import { Pill } from '@payloadcms/ui'

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

const statusPillStyle: Record<string, 'success' | 'warning' | 'error' | 'dark' | 'light'> = {
  synced: 'success',
  pending: 'warning',
  processing: 'light',
  error: 'error',
  'error-permanent': 'error',
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
                      {entry.isDraft && <Pill pillStyle="warning" size="small" className="scrape-ai-inline-pill">DRAFT</Pill>}
                    </td>
                    <td>{entry.sourceCollection}</td>
                    <td>
                      <Pill pillStyle={statusPillStyle[entry.status] || 'light'} size="small">
                        {entry.status}
                      </Pill>
                    </td>
                    <td>{entry.lastSynced ? new Date(entry.lastSynced).toLocaleString() : '\u2014'}</td>
                    <td>{entry.hasAiMeta ? 'Yes' : '\u2014'}</td>
                    <td>
                      <Button
                        buttonStyle="secondary"
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleRegenerate([entry.id]) }}
                      >
                        Regenerate
                      </Button>
                    </td>
                  </tr>
                  {selectedId === entry.id && detail && (
                    <tr>
                      <td colSpan={6} className="scrape-ai-detail">
                        <div className="scrape-ai-detail__header">
                          <Button
                            buttonStyle={viewMode === 'rendered' ? 'primary' : 'secondary'}
                            size="small"
                            onClick={() => setViewMode('rendered')}
                          >Rendered</Button>
                          <Button
                            buttonStyle={viewMode === 'raw' ? 'primary' : 'secondary'}
                            size="small"
                            onClick={() => setViewMode('raw')}
                          >Raw Markdown</Button>
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

          <Pagination
            page={page}
            totalPages={totalPages}
            hasNextPage={page < totalPages}
            hasPrevPage={page > 1}
            onChange={setPage}
          />
        </>
      )}
    </div>
  )
}
