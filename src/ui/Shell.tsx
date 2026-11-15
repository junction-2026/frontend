import type { ReactNode } from 'react'
import { LOCALES, useLocale, useT, type Locale } from '../i18n'
import { Link, navFor, useRoute } from '../router'
import { HealthIndicator } from './HealthIndicator'
import { HostingerBadge } from './HostingerBadge'

const TABS = [
  { key: 'analyze', label: 'shell.nav.analyze', href: '/' },
  { key: 'explore', label: 'shell.nav.explore', href: '/explore' },
  { key: 'history', label: 'shell.nav.history', href: '/history' },
] as const

export function Shell({ children }: { children: ReactNode }) {
  const t = useT()
  const { locale, setLocale } = useLocale()
  const route = useRoute().name
  const active = navFor(route)
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
          <Link href="/docs/api" className="nav-integrate" aria-current={route === 'api-docs' ? 'page' : undefined}>
            {t('shell.integrate_api')}
          </Link>
        </nav>
        <div className="topbar-actions">
          <HealthIndicator />
          <select className="lang-select" aria-label={t('shell.language')} value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
            {LOCALES.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.label}</option>)}
          </select>
        </div>
      </header>
      {children}
      <HostingerBadge />
    </div>
  )
}
