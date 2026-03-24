'use client'

import React, { useEffect, useState } from 'react'

interface CostEstimate {
  modelId: string
  modelName: string
  provider: string
  tier: string
  contextWindow: number
  contextWindowFormatted: string
  totalCost: number
  totalCostFormatted: string
  canHandle: boolean
  recommended: boolean
  reason: string
  notes: string
}

interface TokenEstimate {
  totalDocuments: number
  documentsNeedingEnrichment: number
  totals: {
    totalInputTokens: number
    totalOutputTokens: number
    totalTokens: number
    formatted: {
      totalInputTokens: string
      totalOutputTokens: string
      totalTokens: string
      maxSingleRequest: string
    }
  }
  costEstimates: CostEstimate[]
  recommendation: {
    modelId: string
    modelName: string
    provider: string
    totalCost: number
    totalCostFormatted: string
    reason: string
  } | null
  largestDocuments: Array<{
    title: string
    sourceCollection: string
    contentTokens: number
    contentTokensFormatted: string
    callsBreakdown: { summary: string; entities: string; chunks: string }
  }>
}

export const AiSettings: React.FC = () => {
  const [aiEnabled, setAiEnabled] = useState(false)
  const [provider, setProvider] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [apiCallCount, setApiCallCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [estimate, setEstimate] = useState<TokenEstimate | null>(null)
  const [estimating, setEstimating] = useState(false)

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

  const fetchEstimate = async () => {
    setEstimating(true)
    try {
      const params = provider ? `?provider=${provider}` : ''
      const res = await fetch(`/api/scrape-ai/token-estimate${params}`, { credentials: 'include' })
      if (res.ok) {
        setEstimate(await res.json() as TokenEstimate)
      }
    } catch {}
    setEstimating(false)
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

  const handleApplyRecommendation = (modelId: string, modelProvider: string) => {
    setModel(modelId)
    setProvider(modelProvider)
  }

  const tierColors: Record<string, string> = {
    budget: '#22c55e',
    standard: '#3b82f6',
    premium: '#8b5cf6',
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
          placeholder="e.g., gpt-4.1-nano or claude-haiku-4-5-20251001"
        />
        <span style={styles.hint}>
          Use the token estimator below to find the best model for your content.
        </span>
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

      {/* Token Estimation Section */}
      <div style={styles.estimateSection}>
        <div style={styles.estimateHeader}>
          <h4 style={styles.subheading}>Token Estimation & Model Recommendation</h4>
          <button
            style={styles.estimateButton}
            onClick={fetchEstimate}
            disabled={estimating}
          >
            {estimating ? 'Estimating...' : estimate ? 'Re-estimate' : 'Estimate Tokens'}
          </button>
        </div>

        <p style={styles.estimateHint}>
          Analyzes your content to estimate total AI tokens needed, then recommends the cheapest
          model that can handle your workload.
        </p>

        {estimate && (
          <div style={styles.estimateResults}>
            {/* Summary */}
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>Documents</span>
                <span style={styles.summaryValue}>{estimate.documentsNeedingEnrichment}</span>
                <span style={styles.summaryDetail}>of {estimate.totalDocuments} need enrichment</span>
              </div>
              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>Total Tokens</span>
                <span style={styles.summaryValue}>{estimate.totals.formatted.totalTokens}</span>
                <span style={styles.summaryDetail}>
                  {estimate.totals.formatted.totalInputTokens} in / {estimate.totals.formatted.totalOutputTokens} out
                </span>
              </div>
              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>Largest Request</span>
                <span style={styles.summaryValue}>{estimate.totals.formatted.maxSingleRequest}</span>
                <span style={styles.summaryDetail}>model must handle at least this</span>
              </div>
              {estimate.recommendation && (
                <div style={{ ...styles.summaryCard, borderColor: '#22c55e', borderWidth: '2px' }}>
                  <span style={styles.summaryLabel}>Recommended</span>
                  <span style={styles.summaryValue}>{estimate.recommendation.modelName}</span>
                  <span style={styles.summaryDetail}>{estimate.recommendation.totalCostFormatted} total</span>
                </div>
              )}
            </div>

            {/* Recommendation banner */}
            {estimate.recommendation && (
              <div style={styles.recommendBanner}>
                <div>
                  <strong>Recommended: {estimate.recommendation.modelName}</strong>
                  <span style={{ marginLeft: '8px', color: '#666' }}>
                    ({estimate.recommendation.provider}) — {estimate.recommendation.reason}
                  </span>
                </div>
                <button
                  style={styles.applyButton}
                  onClick={() =>
                    handleApplyRecommendation(
                      estimate.recommendation!.modelId,
                      estimate.recommendation!.provider,
                    )
                  }
                >
                  Apply This Model
                </button>
              </div>
            )}

            {/* Model comparison table */}
            <h4 style={styles.subheading}>All Compatible Models</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Model</th>
                  <th style={styles.th}>Provider</th>
                  <th style={styles.th}>Tier</th>
                  <th style={styles.th}>Context</th>
                  <th style={styles.th}>Est. Cost</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {estimate.costEstimates.map((c) => (
                  <tr
                    key={c.modelId}
                    style={{
                      ...styles.tr,
                      opacity: c.canHandle ? 1 : 0.5,
                      backgroundColor: c.recommended ? '#f0fdf4' : 'transparent',
                    }}
                  >
                    <td style={styles.td}>
                      <strong>{c.modelName}</strong>
                      {c.recommended && <span style={styles.recommendBadge}>BEST VALUE</span>}
                    </td>
                    <td style={styles.td}>{c.provider}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.tierBadge, backgroundColor: tierColors[c.tier] || '#999' }}>
                        {c.tier}
                      </span>
                    </td>
                    <td style={styles.td}>{c.contextWindowFormatted}</td>
                    <td style={styles.td}>
                      <strong>{c.totalCostFormatted}</strong>
                    </td>
                    <td style={styles.td}>
                      {c.canHandle ? (
                        <span style={{ color: '#22c55e' }}>{c.reason || 'Compatible'}</span>
                      ) : (
                        <span style={{ color: '#ef4444' }}>{c.reason}</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {c.canHandle && (
                        <button
                          style={styles.useButton}
                          onClick={() => handleApplyRecommendation(c.modelId, c.provider)}
                        >
                          Use
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Largest documents */}
            {estimate.largestDocuments.length > 0 && (
              <>
                <h4 style={styles.subheading}>Top 10 Largest Documents</h4>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Document</th>
                      <th style={styles.th}>Collection</th>
                      <th style={styles.th}>Content Tokens</th>
                      <th style={styles.th}>Summary Call</th>
                      <th style={styles.th}>Entities Call</th>
                      <th style={styles.th}>Chunks Call</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimate.largestDocuments.map((doc, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}>{doc.title}</td>
                        <td style={styles.td}>{doc.sourceCollection}</td>
                        <td style={styles.td}><strong>{doc.contentTokensFormatted}</strong></td>
                        <td style={styles.td}><code style={styles.code}>{doc.callsBreakdown.summary}</code></td>
                        <td style={styles.td}><code style={styles.code}>{doc.callsBreakdown.entities}</code></td>
                        <td style={styles.td}><code style={styles.code}>{doc.callsBreakdown.chunks}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
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
  subheading: { margin: '20px 0 10px 0', fontSize: '14px', fontWeight: 600 },
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
  hint: {
    fontSize: '12px',
    color: 'var(--theme-elevation-400, #999)',
    marginTop: '4px',
    display: 'block',
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
  estimateSection: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: 'var(--theme-elevation-50, #fafafa)',
    borderRadius: '8px',
    border: '1px solid var(--theme-elevation-100, #e8e8e8)',
  },
  estimateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimateButton: {
    padding: '8px 16px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
  estimateHint: {
    fontSize: '13px',
    color: 'var(--theme-elevation-500, #777)',
    margin: '8px 0 0 0',
  },
  estimateResults: { marginTop: '16px' },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
  },
  summaryCard: {
    padding: '14px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid var(--theme-elevation-100, #e0e0e0)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  summaryLabel: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, color: '#888' },
  summaryValue: { fontSize: '22px', fontWeight: 700 },
  summaryDetail: { fontSize: '12px', color: '#999' },
  recommendBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  applyButton: {
    padding: '6px 14px',
    backgroundColor: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th: {
    textAlign: 'left' as const,
    padding: '8px 10px',
    borderBottom: '2px solid var(--theme-elevation-100, #e0e0e0)',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: '#888',
  },
  tr: { borderBottom: '1px solid var(--theme-elevation-50, #f0f0f0)' },
  td: { padding: '8px 10px', fontSize: '13px' },
  recommendBadge: {
    marginLeft: '8px',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: '#22c55e',
    color: 'white',
    fontSize: '10px',
    fontWeight: 700,
  },
  tierBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '11px',
    fontWeight: 600,
  },
  useButton: {
    padding: '4px 10px',
    fontSize: '12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  code: { fontSize: '11px', fontFamily: 'monospace', color: '#666' },
}
