'use client'

import React, { useState } from 'react'
import { Button, CopyToClipboard } from '@payloadcms/ui'

interface EndpointInfo {
  path: string
  method: string
  description: string
}

export const EndpointsPanel: React.FC<{ siteUrl: string }> = ({ siteUrl }) => {
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)

  const endpoints: EndpointInfo[] = [
    { path: '/api/llms.txt', method: 'GET', description: 'Curated AI-friendly index' },
    { path: '/api/llms-full.txt', method: 'GET', description: 'Comprehensive content listing' },
    { path: '/api/ai/sitemap.json', method: 'GET', description: 'Content relationships & hierarchy' },
    { path: '/api/ai/context?query=example', method: 'GET', description: 'Context query for AI agents' },
    { path: '/api/ai/{collection}/{slug}.md', method: 'GET', description: 'Individual page markdown' },
    {
      path: '/api/ai/structured/{collection}/{slug}.json',
      method: 'GET',
      description: 'JSON-LD structured data',
    },
  ]

  const handleTest = async (path: string) => {
    setTestingEndpoint(path)
    setTestResult(null)
    try {
      const res = await fetch(`/api${path.replace('/api', '')}`)
      const contentType = res.headers.get('content-type') || ''
      let body: string
      if (contentType.includes('json')) {
        body = JSON.stringify(await res.json(), null, 2)
      } else {
        body = await res.text()
      }
      setTestResult(body.slice(0, 2000))
    } catch (e: any) {
      setTestResult(`Error: ${e.message}`)
    } finally {
      setTestingEndpoint(null)
    }
  }

  return (
    <div className="scrape-ai-card">
      <h3 className="scrape-ai-card__heading">Endpoints &amp; Access</h3>

      <div>
        {endpoints.map((ep) => (
          <div key={ep.path} className="scrape-ai-endpoint">
            <div className="scrape-ai-endpoint__info">
              <code className="scrape-ai-endpoint__path">
                {ep.method} {ep.path}
              </code>
              <span className="scrape-ai-endpoint__description">{ep.description}</span>
            </div>
            <div className="scrape-ai-endpoint__actions">
              <CopyToClipboard value={`${siteUrl}${ep.path}`} defaultMessage="Copy URL" successMessage="Copied!" />
              {!ep.path.includes('{') && (
                <Button
                  type="button"
                  buttonStyle="secondary"
                  size="small"
                  onClick={() => handleTest(ep.path)}
                  disabled={testingEndpoint === ep.path}
                >
                  {testingEndpoint === ep.path ? 'Testing...' : 'Test'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {testResult && (
        <div style={{ marginTop: 16 }}>
          <h4 className="scrape-ai-card__subheading">Response</h4>
          <pre className="scrape-ai-code">{testResult}</pre>
        </div>
      )}

      <div className="scrape-ai-guide">
        <h4 className="scrape-ai-card__subheading" style={{ margin: '0 0 8px 0' }}>Integration Guide</h4>
        <p className="scrape-ai-guide__text">
          Point AI agents to <code>{siteUrl}/api/llms.txt</code> as the entry point.
          The llms.txt file links to all available content in markdown format.
        </p>
        <p className="scrape-ai-guide__text">
          For programmatic access, use the <code>/api/ai/context?query=...</code> endpoint
          to search content by relevance.
        </p>
      </div>
    </div>
  )
}
