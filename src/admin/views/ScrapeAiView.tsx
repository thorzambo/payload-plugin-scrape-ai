import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { DashboardClient } from './DashboardClient'

export function ScrapeAiView(props: AdminViewServerProps) {
  return (
    <div style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <DashboardClient />
    </div>
  )
}
