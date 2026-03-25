'use client'

import React, { useEffect, useState } from 'react'
import { Button, CheckboxInput } from '@payloadcms/ui'

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
    // R3: Custom card container — Payload's Card component is a clickable navigation
    // card (title + optional action) and does not support arbitrary children content.
    // Styled via .scrape-ai-card using only Payload CSS tokens for theme adaptation.
    <div className="scrape-ai-card">
      <h3 className="scrape-ai-card__heading">llms.txt Manager</h3>

      {priority.length > 0 && (
        <div className="scrape-ai-priority-list">
          <h4 className="scrape-ai-card__subheading scrape-ai-subheading--compact">Priority Order (drag to reorder)</h4>
          {priority.map((entry, i) => (
            <div
              key={entry.slug}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className="scrape-ai-priority-item"
              style={{ opacity: dragIndex === i ? 0.5 : 1 }}
            >
              <span className="scrape-ai-priority-item__handle">&#x2630;</span>
              <span className="scrape-ai-priority-item__slug">{entry.slug}</span>
              <span className="scrape-ai-priority-item__section">{entry.section}</span>
              <CheckboxInput
                checked={entry.optional}
                onToggle={() => toggleOptional(i)}
                label="Optional"
                name={`optional-${entry.slug}`}
                className="scrape-ai-priority-item__optional"
              />
            </div>
          ))}
          <Button type="button" buttonStyle="primary" size="small" onClick={handleSave} disabled={saving} className="scrape-ai-priority-save">
            {saving ? 'Saving...' : 'Save & Rebuild'}
          </Button>
        </div>
      )}

      <div className="scrape-ai-mt-16">
        <div className="scrape-ai-preview-header">
          <Button
            type="button"
            buttonStyle={!showFull ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setShowFull(false)}
          >
            llms.txt
          </Button>
          <Button
            type="button"
            buttonStyle={showFull ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setShowFull(true)}
          >
            llms-full.txt
          </Button>
        </div>
        <pre className="scrape-ai-code">
          {showFull ? fullPreview || 'No content yet' : preview || 'No content yet'}
        </pre>
      </div>
    </div>
  )
}
