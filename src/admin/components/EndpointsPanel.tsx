'use client'

import React, { useState } from 'react'

interface EndpointInfo {
  path: string
  method: string
  description: string
}

export const EndpointsPanel: React.FC<{ siteUrl: string }> = ({ siteUrl }) => {
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

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

  const handleCopy = async (path: string) => {
    const url = `${siteUrl}${path}`
    await navigator.clipboard.writeText(url)
    setCopied(path)
    setTimeout(() => setCopied(null), 2000)
  }

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
    <div style={styles.container}>
      <h3 style={styles.heading}>Endpoints & Access</h3>

      <div style={styles.list}>
        {endpoints.map((ep) => (
          <div key={ep.path} style={styles.row}>
            <div style={styles.info}>
              <code style={styles.path}>
                {ep.method} {ep.path}
              </code>
              <span style={styles.description}>{ep.description}</span>
            </div>
            <div style={styles.actions}>
              <button style={styles.button} onClick={() => handleCopy(ep.path)}>
                {copied === ep.path ? 'Copied!' : 'Copy URL'}
              </button>
              {!ep.path.includes('{') && (
                <button
                  style={styles.button}
                  onClick={() => handleTest(ep.path)}
                  disabled={testingEndpoint === ep.path}
                >
                  {testingEndpoint === ep.path ? 'Testing...' : 'Test'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {testResult && (
        <div style={styles.testOutput}>
          <h4 style={styles.subheading}>Response</h4>
          <pre style={styles.codeBlock}>{testResult}</pre>
        </div>
      )}

      <div style={styles.instructions}>
        <h4 style={styles.subheading}>Integration Guide</h4>
        <p style={styles.text}>
          Point AI agents to <code>{siteUrl}/api/llms.txt</code> as the entry point.
          The llms.txt file links to all available content in markdown format.
        </p>
        <p style={styles.text}>
          For programmatic access, use the <code>/api/ai/context?query=...</code> endpoint
          to search content by relevance.
        </p>
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
  subheading: { margin: '12px 0 8px 0', fontSize: '14px', fontWeight: 500 },
  list: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
    borderRadius: '6px',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  info: { display: 'flex', flexDirection: 'column' as const, gap: '2px' },
  path: { fontSize: '13px', fontFamily: 'monospace', fontWeight: 500 },
  description: { fontSize: '12px', color: 'var(--theme-elevation-400, #999)' },
  actions: { display: 'flex', gap: '6px' },
  button: {
    padding: '4px 10px',
    fontSize: '12px',
    borderRadius: '4px',
    border: '1px solid var(--theme-elevation-200, #ddd)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  testOutput: { marginTop: '16px' },
  codeBlock: {
    padding: '12px',
    backgroundColor: 'var(--theme-elevation-100, #f0f0f0)',
    borderRadius: '6px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '300px',
    whiteSpace: 'pre-wrap' as const,
    fontFamily: 'monospace',
  },
  instructions: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: 'var(--theme-elevation-50, #f8f8f8)',
    borderRadius: '6px',
  },
  text: { fontSize: '13px', margin: '4px 0', lineHeight: '1.5' },
}
