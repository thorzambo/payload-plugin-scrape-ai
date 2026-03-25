'use client'

import React from 'react'
import { Link } from '@payloadcms/ui'

const NavLink: React.FC = () => {
  return (
    <Link href="/admin/scrape-ai" className="scrape-ai-nav" preventDefault={false}>
      <span className="scrape-ai-nav__icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </span>
      Scrape AI
    </Link>
  )
}

export default NavLink
