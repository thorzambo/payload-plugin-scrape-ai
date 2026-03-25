'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@payloadcms/ui'
import { Pill } from '@payloadcms/ui'

interface CostEstimate {
  modelId: string; modelName: string; provider: string; tier: string
  contextWindow: number; contextWindowFormatted: string
  totalCost: number; totalCostFormatted: string
  canHandle: boolean; recommended: boolean; reason: string; notes: string
}

interface TokenEstimate {
  totalDocuments: number; documentsNeedingEnrichment: number
  totals: {
    totalInputTokens: number; totalOutputTokens: number; totalTokens: number
    formatted: { totalInputTokens: string; totalOutputTokens: string; totalTokens: string; maxSingleRequest: string }
  }
  costEstimates: CostEstimate[]
  recommendation: { modelId: string; modelName: string; provider: string; totalCost: number; totalCostFormatted: string; reason: string } | null
  largestDocuments: Array<{ title: string; sourceCollection: string; contentTokens: number; contentTokensFormatted: string; callsBreakdown: { summary: string; entities: string; chunks: string } }>
}

const tierPillStyle: Record<string, 'success' | 'light' | 'dark'> = {
  budget: 'success',
  standard: 'light',
  premium: 'dark',
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

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/scrape-ai/status', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json() as any
        setAiEnabled(data.aiEnabled || false); setProvider(data.aiProvider || ''); setModel(data.aiModel || ''); setApiCallCount(data.aiApiCallCount || 0)
      }
    } catch {}
  }

  const fetchEstimate = async () => {
    setEstimating(true)
    try {
      const params = provider ? `?provider=${provider}` : ''
      const res = await fetch(`/api/scrape-ai/token-estimate${params}`, { credentials: 'include' })
      if (res.ok) setEstimate(await res.json() as TokenEstimate)
    } catch {}
    setEstimating(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data: Record<string, any> = { aiEnabled, aiProvider: provider, aiModel: model }
      if (apiKey) data.aiApiKey = apiKey
      await fetch('/api/scrape-ai/ai-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data) })
    } finally { setSaving(false) }
  }

  const handleTest = async () => {
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch('/api/scrape-ai/test-ai', { method: 'POST', credentials: 'include' })
      const data = await res.json() as any
      setTestResult({ success: data.success, message: data.success ? `Connected! Response: "${data.response}"` : data.error })
    } catch (e: any) { setTestResult({ success: false, message: e.message }) }
    finally { setTesting(false) }
  }

  const handleApplyRecommendation = (modelId: string, modelProvider: string) => { setModel(modelId); setProvider(modelProvider) }

  return (
    <div className="scrape-ai-card">
      <h3 className="scrape-ai-card__heading">AI Enrichment Settings</h3>

      <div className="scrape-ai-field">
        <label className="scrape-ai-field__label scrape-ai-field__label--inline">
          <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} className="scrape-ai-field__checkbox" />
          Enable AI Enrichment
        </label>
      </div>

      <div className="scrape-ai-field">
        <label className="scrape-ai-field__label">Provider</label>
        <select className="scrape-ai-field__select" value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="">Select provider...</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </div>

      <div className="scrape-ai-field">
        <label className="scrape-ai-field__label">API Key</label>
        <input type="password" className="scrape-ai-field__input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter API key (leave blank to keep current)" />
      </div>

      <div className="scrape-ai-field">
        <label className="scrape-ai-field__label">Model</label>
        <input type="text" className="scrape-ai-field__input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g., gpt-4.1-nano or claude-haiku-4-5-20251001" />
        <span className="scrape-ai-field__hint">Use the token estimator below to find the best model for your content.</span>
      </div>

      <div className="scrape-ai-actions">
        <Button type="button" buttonStyle="primary" size="small" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button type="button" buttonStyle="secondary" size="small" onClick={handleTest} disabled={testing}>
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>

      {testResult && (
        <div className={`scrape-ai-alert ${testResult.success ? 'scrape-ai-alert--success' : 'scrape-ai-alert--error'}`}>
          {testResult.message}
        </div>
      )}

      <div className="scrape-ai-stats">API calls this month: <strong>{apiCallCount}</strong></div>

      <div className="scrape-ai-estimate">
        <div className="scrape-ai-estimate__header">
          <h4 className="scrape-ai-card__subheading" style={{ margin: 0 }}>Token Estimation &amp; Model Recommendation</h4>
          <Button type="button" buttonStyle="primary" size="small" onClick={fetchEstimate} disabled={estimating}>
            {estimating ? 'Estimating...' : estimate ? 'Re-estimate' : 'Estimate Tokens'}
          </Button>
        </div>
        <p className="scrape-ai-estimate__hint">Analyzes your content to estimate total AI tokens needed, then recommends the cheapest model that can handle your workload.</p>

        {estimate && (
          <div className="scrape-ai-mt-16">
            <div className="scrape-ai-summary-grid">
              <div className="scrape-ai-summary-card">
                <span className="scrape-ai-summary-card__label">Documents</span>
                <span className="scrape-ai-summary-card__value">{estimate.documentsNeedingEnrichment}</span>
                <span className="scrape-ai-summary-card__detail">of {estimate.totalDocuments} need enrichment</span>
              </div>
              <div className="scrape-ai-summary-card">
                <span className="scrape-ai-summary-card__label">Total Tokens</span>
                <span className="scrape-ai-summary-card__value">{estimate.totals.formatted.totalTokens}</span>
                <span className="scrape-ai-summary-card__detail">{estimate.totals.formatted.totalInputTokens} in / {estimate.totals.formatted.totalOutputTokens} out</span>
              </div>
              <div className="scrape-ai-summary-card">
                <span className="scrape-ai-summary-card__label">Largest Request</span>
                <span className="scrape-ai-summary-card__value">{estimate.totals.formatted.maxSingleRequest}</span>
                <span className="scrape-ai-summary-card__detail">model must handle at least this</span>
              </div>
              {estimate.recommendation && (
                <div className="scrape-ai-summary-card scrape-ai-summary-card--highlight">
                  <span className="scrape-ai-summary-card__label">Recommended</span>
                  <span className="scrape-ai-summary-card__value">{estimate.recommendation.modelName}</span>
                  <span className="scrape-ai-summary-card__detail">{estimate.recommendation.totalCostFormatted} total</span>
                </div>
              )}
            </div>

            {estimate.recommendation && (
              <div className="scrape-ai-recommend">
                <div>
                  <strong>Recommended: {estimate.recommendation.modelName}</strong>
                  <span className="scrape-ai-recommendation__detail">({estimate.recommendation.provider}) — {estimate.recommendation.reason}</span>
                </div>
                <Button type="button" buttonStyle="primary" size="small" onClick={() => handleApplyRecommendation(estimate.recommendation!.modelId, estimate.recommendation!.provider)}>
                  Apply This Model
                </Button>
              </div>
            )}

            <h4 className="scrape-ai-card__subheading">All Compatible Models</h4>
            <table className="scrape-ai-table">
              <thead>
                <tr><th>Model</th><th>Provider</th><th>Tier</th><th>Context</th><th>Est. Cost</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {estimate.costEstimates.map((c) => (
                  <tr key={c.modelId} className={`${!c.canHandle ? 'scrape-ai-row--disabled' : ''} ${c.recommended ? 'scrape-ai-row--recommended' : ''}`.trim()}>
                    <td>
                      <strong>{c.modelName}</strong>
                      {c.recommended && <Pill pillStyle="success" size="small" className="scrape-ai-inline-pill">BEST VALUE</Pill>}
                    </td>
                    <td>{c.provider}</td>
                    <td><Pill pillStyle={tierPillStyle[c.tier] || 'light'} size="small">{c.tier}</Pill></td>
                    <td>{c.contextWindowFormatted}</td>
                    <td><strong>{c.totalCostFormatted}</strong></td>
                    <td>{c.canHandle ? <span className="scrape-ai-status--compatible">{c.reason || 'Compatible'}</span> : <span className="scrape-ai-status--incompatible">{c.reason}</span>}</td>
                    <td>{c.canHandle && <Button type="button" buttonStyle="secondary" size="small" onClick={() => handleApplyRecommendation(c.modelId, c.provider)}>Use</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {estimate.largestDocuments.length > 0 && (
              <>
                <h4 className="scrape-ai-card__subheading">Top 10 Largest Documents</h4>
                <table className="scrape-ai-table">
                  <thead>
                    <tr><th>Document</th><th>Collection</th><th>Content Tokens</th><th>Summary</th><th>Entities</th><th>Chunks</th></tr>
                  </thead>
                  <tbody>
                    {estimate.largestDocuments.map((doc, i) => (
                      <tr key={i}>
                        <td>{doc.title}</td>
                        <td>{doc.sourceCollection}</td>
                        <td><strong>{doc.contentTokensFormatted}</strong></td>
                        <td><code className="scrape-ai-code--inline">{doc.callsBreakdown.summary}</code></td>
                        <td><code className="scrape-ai-code--inline">{doc.callsBreakdown.entities}</code></td>
                        <td><code className="scrape-ai-code--inline">{doc.callsBreakdown.chunks}</code></td>
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
