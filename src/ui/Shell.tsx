import type { ReactNode } from 'react'
import { Link, navFor, useRoute } from '../router'
import { HealthIndicator } from './HealthIndicator'
import { Mock } from './MockBadge'

const TABS = [
  { key: 'analyze', label: 'Analyze', href: '/' },
  { key: 'explore', label: 'Explore', href: '/explore' },
  { key: 'history', label: 'History', href: '/history' },
] as const

export function Shell({ children }: { children: ReactNode }) {
  const active = navFor(useRoute().name)
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          VEIL <span>/ Intelligence</span>
        </Link>
        <nav className="nav-tabs" aria-label="Primary">
          {TABS.map((t) => (
            <Link key={t.key} href={t.href} className={t.key === active ? 'active' : undefined} aria-current={t.key === active ? 'page' : undefined}>
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="topbar-actions">
          <HealthIndicator />
          <Mock label="Language selector">
            <button type="button" className="lang-btn">English ▾</button>
          </Mock>
          <Link className="btn-primary" href="/">+ New Analysis</Link>
          <Link className="avatar" href="/settings" aria-label="Account">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.2" /><path d="M5.5 19c1.6-3.2 4-4.8 6.5-4.8S16.9 15.8 18.5 19" /></svg>
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}
