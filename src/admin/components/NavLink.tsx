'use client'

import React from 'react'

const NavLink: React.FC = () => {
  return (
    <a
      href="/admin/scrape-ai"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        fontSize: '14px',
        color: 'var(--theme-elevation-800, #444)',
        textDecoration: 'none',
        borderRadius: '4px',
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={(e) => {
        ;(e.target as HTMLElement).style.backgroundColor = 'var(--theme-elevation-50, #f5f5f5)'
      }}
      onMouseLeave={(e) => {
        ;(e.target as HTMLElement).style.backgroundColor = 'transparent'
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
      Scrape AI
    </a>
  )
}

export default NavLink
