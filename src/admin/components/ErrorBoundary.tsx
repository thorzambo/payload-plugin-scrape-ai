'use client'

import React from 'react'
import { Banner } from '@payloadcms/ui'

interface Props {
  children: React.ReactNode
  fallbackLabel?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Banner type="error">
          <div>
            <strong>{this.props.fallbackLabel || 'Something went wrong'}</strong>
            <p style={{ fontSize: '0.8125rem', margin: '4px 0 0 0' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
        </Banner>
      )
    }

    return this.props.children
  }
}
