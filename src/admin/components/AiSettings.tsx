'use client'

import React, { useEffect, useState } from 'react'

export const AiSettings: React.FC = () => {
  const [aiEnabled, setAiEnabled] = useState(false)
  const [provider, setProvider] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [apiCallCount, setApiCallCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/scrape-ai/status', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json() as any
        setAiEnabled(data.aiEnabled || false)
        setProvider(data.aiProvider || '')
        setModel(data.aiModel || '')
        setApiCallCount(data.aiApiCallCount || 0)
      }
    } catch {}
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data: Record<string, any> = { aiEnabled, aiProvider: provider, aiModel: model }
      if (apiKey) data.aiApiKey = apiKey
      await fetch('/api/scrape-ai/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/scrape-ai/test-ai', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json() as any
      setTestResult({
        success: data.success,
        message: data.success ? `Connected! Response: "${data.response}"` : data.error,
      })
    } catch (e: any) {
      setTestResult({ success: false, message: e.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>AI Enrichment Settings</h3>

      <div style={styles.field}>
        <label style={styles.label}>
          <input
            type="checkbox"
            checked={aiEnabled}
            onChange={(e) => setAiEnabled(e.target.checked)}
            style={styles.checkbox}
          />
          Enable AI Enrichment
        </label>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Provider</label>
        <select
          style={styles.input}
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          <option value="">Select provider...</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>API Key</label>
        <input
          type="password"
          style={styles.input}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter API key (leave blank to keep current)"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Model</label>
        <input
          type="text"
          style={styles.input}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="e.g., gpt-4o-mini or claude-haiku-4-5-20251001"
        />
      </div>

      <div style={styles.actions}>
        <button style={styles.saveButton} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button style={styles.testButton} onClick={handleTest} disabled={testing}>
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {testResult && (
        <div
          style={{
            ...styles.testResult,
            backgroundColor: testResult.success ? '#dcfce7' : '#fee2e2',
            color: testResult.success ? '#166534' : '#991b1b',
          }}
        >
          {testResult.message}
        </div>
      )}

      <div style={styles.stats}>
        API calls this month: <strong>{apiCallCount}</strong>
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
  field: { marginBottom: '12px' },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    marginBottom: '4px',
    fontWeight: 500,
  },
  checkbox: { width: '18px', height: '18px' },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--theme-elevation-200, #ddd)',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  actions: { display: 'flex', gap: '8px', marginTop: '16px' },
  saveButton: {
    padding: '8px 16px',
    backgroundColor: 'var(--theme-elevation-900, #333)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  testButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid var(--theme-elevation-300, #ccc)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  testResult: {
    marginTop: '12px',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
  },
  stats: {
    marginTop: '16px',
    padding: '10px 14px',
    backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
    borderRadius: '6px',
    fontSize: '13px',
  },
}
