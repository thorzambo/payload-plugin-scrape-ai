'use client'

import React, { useEffect, useState } from 'react'
import { Button, Collapsible, Pagination, Pill, SelectInput, ShimmerEffect } from '@payloadcms/ui'

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

interface DeadLetterEntry {
  id: string
  title: string
  slug: string
  sourceCollection: string
  sourceDocId: string
  errorMessage?: string
  retryCount: number
  lastSynced: string
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
  const [deadLetterEntries, setDeadLetterEntries] = useState<DeadLetterEntry[]>([])
  const [deadLetterCount, setDeadLetterCount] = useState(0)

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

  const fetchDeadLetter = async () => {
    try {
      const res = await fetch('/api/scrape-ai/dead-letter', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json() as any
        setDeadLetterEntries(data.docs || [])
        setDeadLetterCount(data.totalDocs || 0)
      }
    } catch {}
  }

  useEffect(() => { fetchEntries(); fetchDeadLetter() }, [page, filterStatus])

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
    // R3: Custom card container — Payload's Card component is a clickable navigation
    // card (title + optional action) and does not support arbitrary children content.
    // Styled via .scrape-ai-card using only Payload CSS tokens for theme adaptation.
    <div className="scrape-ai-card">
      <div className="scrape-ai-header-row">
        <h3 className="scrape-ai-card__heading">Content Entries ({totalDocs})</h3>
        <div className="scrape-ai-filters">
          <SelectInput
            path="filterStatus"
            name="filterStatus"
            value={filterStatus}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Synced', value: 'synced' },
              { label: 'Pending', value: 'pending' },
              { label: 'Error', value: 'error' },
              { label: 'Permanent Error', value: 'error-permanent' },
            ]}
            onChange={(opt) => {
              const val = opt && !Array.isArray(opt) ? String(opt.value) : ''
              setFilterStatus(val)
              setPage(1)
            }}
            isClearable={false}
            style={{ width: 'auto', minWidth: '160px' }}
          />
        </div>
      </div>

      {deadLetterCount > 0 && (
        <Collapsible header={`Dead Letter Queue (${deadLetterCount} permanent errors)`} initCollapsed={true} className="scrape-ai-collapsible">
          {/* R4: Custom table — Payload's Table requires Column[] with pre-rendered cells
              and is tightly coupled to the collection list view data pipeline. */}
          <table className="scrape-ai-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Collection</th>
                <th>Error</th>
                <th>Retries</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deadLetterEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.title}</td>
                  <td>{entry.sourceCollection}</td>
                  <td><span className="scrape-ai-status--incompatible">{entry.errorMessage || 'Unknown error'}</span></td>
                  <td>{entry.retryCount}</td>
                  <td>
                    <Button type="button" buttonStyle="secondary" size="small" onClick={() => handleRegenerate([entry.id])}>
                      Retry
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Collapsible>
      )}

      {loading ? <ShimmerEffect /> : (
        <>
          {/* R4: Custom table — Payload's Table requires Column[] with pre-rendered cells
              and is tightly coupled to the collection list view data pipeline. */}
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
                  <tr className="scrape-ai-row--clickable" onClick={() => handleRowClick(entry.id)}>
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
                        type="button"
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
                            type="button"
                            buttonStyle={viewMode === 'rendered' ? 'primary' : 'secondary'}
                            size="small"
                            onClick={() => setViewMode('rendered')}
                          >Rendered</Button>
                          <Button
                            type="button"
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
                          <Collapsible header="JSON-LD" initCollapsed={true} className="scrape-ai-collapsible">
                            <pre className="scrape-ai-code">{JSON.stringify((detail as any).jsonLd, null, 2)}</pre>
                          </Collapsible>
                        )}
                        {(detail as any).aiMeta && (
                          <Collapsible header="AI Metadata" initCollapsed={true} className="scrape-ai-collapsible">
                            <pre className="scrape-ai-code">{JSON.stringify((detail as any).aiMeta, null, 2)}</pre>
                          </Collapsible>
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
