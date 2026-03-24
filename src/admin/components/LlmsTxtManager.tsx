'use client'

import React, { useEffect, useState } from 'react'

interface PriorityEntry {
  slug: string
  section: string
  optional: boolean
}

interface Section {
  name: string
  label: string
}

export const LlmsTxtManager: React.FC = () => {
  const [priority, setPriority] = useState<PriorityEntry[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [preview, setPreview] = useState('')
  const [showFull, setShowFull] = useState(false)
  const [fullPreview, setFullPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchConfig()
    fetchPreview()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/scrape-ai/llms-txt-config', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json() as any
        setPriority(data.priority || [])
        setSections(data.sections || [])
      }
    } catch {}
  }

  const fetchPreview = async () => {
    try {
      const [llmsRes, fullRes] = await Promise.all([
        fetch('/api/llms.txt'),
        fetch('/api/llms-full.txt'),
      ])
      if (llmsRes.ok) setPreview(await llmsRes.text())
      if (fullRes.ok) setFullPreview(await fullRes.text())
    } catch {}
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/scrape-ai/llms-txt-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priority, sections }),
      })
      // Re-fetch preview after rebuild
      setTimeout(fetchPreview, 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleDragStart = (index: number) => setDragIndex(index)
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const newPriority = [...priority]
    const item = newPriority.splice(dragIndex, 1)[0]
    newPriority.splice(index, 0, item)
    setPriority(newPriority)
    setDragIndex(index)
  }
  const handleDragEnd = () => setDragIndex(null)

  const toggleOptional = (index: number) => {
    const newPriority = [...priority]
    newPriority[index] = { ...newPriority[index], optional: !newPriority[index].optional }
    setPriority(newPriority)
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>llms.txt Manager</h3>

      {priority.length > 0 && (
        <div style={styles.priorityList}>
          <h4 style={styles.subheading}>Priority Order (drag to reorder)</h4>
          {priority.map((entry, i) => (
            <div
              key={entry.slug}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              style={{
                ...styles.priorityItem,
                opacity: dragIndex === i ? 0.5 : 1,
              }}
            >
              <span style={styles.dragHandle}>&#x2630;</span>
              <span style={styles.entrySlug}>{entry.slug}</span>
              <span style={styles.entrySection}>{entry.section}</span>
              <label style={styles.optionalLabel}>
                <input
                  type="checkbox"
                  checked={entry.optional}
                  onChange={() => toggleOptional(i)}
                />
                Optional
              </label>
            </div>
          ))}
          <button style={styles.saveButton} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save & Rebuild'}
          </button>
        </div>
      )}

      <div style={styles.previewSection}>
        <div style={styles.previewHeader}>
          <button
            style={!showFull ? styles.activeTab : styles.tab}
            onClick={() => setShowFull(false)}
          >
            llms.txt
          </button>
          <button
            style={showFull ? styles.activeTab : styles.tab}
            onClick={() => setShowFull(true)}
          >
            llms-full.txt
          </button>
        </div>
        <pre style={styles.previewContent}>
          {showFull ? fullPreview || 'No content yet' : preview || 'No content yet'}
        </pre>
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
  heading: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 },
  subheading: { margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500 },
  priorityList: { marginBottom: '20px' },
  priorityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    marginBottom: '4px',
    backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
    borderRadius: '4px',
    cursor: 'grab',
  },
  dragHandle: { fontSize: '14px', cursor: 'grab', color: '#999' },
  entrySlug: { flex: 1, fontSize: '13px', fontFamily: 'monospace' },
  entrySection: { fontSize: '12px', color: '#888' },
  optionalLabel: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' },
  saveButton: {
    marginTop: '12px',
    padding: '8px 16px',
    backgroundColor: 'var(--theme-elevation-900, #333)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  previewSection: { marginTop: '16px' },
  previewHeader: { display: 'flex', gap: '8px', marginBottom: '12px' },
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
  previewContent: {
    padding: '16px',
    backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
    borderRadius: '6px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '500px',
    whiteSpace: 'pre-wrap' as const,
    fontFamily: 'monospace',
  },
}
