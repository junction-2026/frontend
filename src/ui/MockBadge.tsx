import type { ReactNode } from 'react'
import { useT } from '../i18n'

// Marks UI that is not connected to the backend. Never wrap real data in it; list the area in docs/mock-areas.md.
export function Mock({ label, block, children }: { label?: string; block?: boolean; children: ReactNode }) {
  const t = useT()
  const title = label ? t('common.mock.title_labeled', { label }) : t('common.mock.title')
  return (
    <span className={block ? 'mock mock-block' : 'mock'} data-mock="true" title={title} aria-label={title}>
      <span className="mock-badge" aria-hidden="true">{t('common.mock.badge')}</span>
      {children}
    </span>
  )
}

export default Mock
