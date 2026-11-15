import type { ReactNode } from 'react'
import { LOCALES, useLocale, useT, type Locale } from '../i18n'
import { Link, navFor, useRoute } from '../router'
import { HealthIndicator } from './HealthIndicator'

const TABS = [
  { key: 'analyze', label: 'shell.nav.analyze', href: '/' },
  { key: 'explore', label: 'shell.nav.explore', href: '/explore' },
  { key: 'history', label: 'shell.nav.history', href: '/history' },
] as const

export function Shell({ children }: { children: ReactNode }) {
  const t = useT()
  const { locale, setLocale } = useLocale()
  const active = navFor(useRoute().name)
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          VEIL <span>{t('shell.brand_subtitle')}</span>
        </Link>
        <nav className="nav-tabs" aria-label={t('shell.nav.label')}>
          {TABS.map((tab) => (
            <Link key={tab.key} href={tab.href} className={tab.key === active ? 'active' : undefined} aria-current={tab.key === active ? 'page' : undefined}>
              {t(tab.label)}
            </Link>
          ))}
        </nav>
        <div className="topbar-actions">
          <HealthIndicator />
          <select className="lang-select" aria-label={t('shell.language')} value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
            {LOCALES.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.label}</option>)}
          </select>
          <Link className="avatar" href="/settings" aria-label={t('shell.account')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.2" /><path d="M5.5 19c1.6-3.2 4-4.8 6.5-4.8S16.9 15.8 18.5 19" /></svg>
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}
