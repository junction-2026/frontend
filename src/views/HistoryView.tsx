import { useState } from 'react'
import { verdictOf, type JobSummary } from '../api/types'
import { useLocale, useT } from '../i18n'
import { dayLabel, relativeTime } from '../history/format'
import { useExcerpts } from '../history/useExcerpts'
import { useHistory } from '../history/useHistory'
import { VERDICT_UI } from '../job/read'
import { ErrorAlert, Skeleton } from '../job/WithJob'
import { Link } from '../router'
import { Mock } from '../ui/MockBadge'
import '../job/results.css'
import '../history/history.css'

const FILTERS = [
  { key: 'all', status: undefined },
  { key: 'running', status: 'running' },
  { key: 'completed', status: 'completed' },
  { key: 'failed', status: 'failed' },
  { key: 'cancelled', status: 'cancelled' },
] as const

const STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled']

function statusTone(j: JobSummary) {
  if (j.status === 'failed') return 'orange'
  if (j.status === 'completed') return 'green'
  return j.done ? 'gray' : 'blue'
}

function Item({ job, excerpt, now }: { job: JobSummary; excerpt: string | null | undefined; now: number }) {
  const t = useT()
  const { locale } = useLocale()
  // API status values are translated when known; an unknown one is shown as sent.
  const status = (s: string) => (STATUSES.includes(s) ? t(`history.status.${s}`) : s)
  const verdict = job.finalization?.verdict
  const kind = typeof verdict === 'string' ? verdictOf(verdict) : null
  const v = kind ? VERDICT_UI[kind] : null
  return (
    <article className="card history-item">
      <div>
        <div className="top">
          <span>{job.id}</span>
          <span className={`status-pill ${statusTone(job)}`}>{status(job.status)}</span>
        </div>
        <h3>
          {excerpt === undefined ? <span className="skeleton-line" aria-hidden="true" /> : excerpt === null ? t('history.excerpt_unavailable') : `“${excerpt}”`}
        </h3>
        <div className="tags">
          {v ? <span className={`tag ${v.tone}`}>{t(`history.verdict.${kind}`)}</span> : <span className="tag gray">{t('history.final_assessment', { status: job.finalization?.status ? status(job.finalization.status) : t('history.status.unknown') })}</span>}
        </div>
      </div>
      <div className="history-right">
        <span>{relativeTime(job.created_at, now, locale, t)}</span>
        <Link className="btn-link" href={`/jobs/${encodeURIComponent(job.id)}`}>{t('history.reopen')}</Link>
      </div>
    </article>
  )
}

export default function HistoryView() {
  const t = useT()
  const { locale } = useLocale()
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [now] = useState(Date.now) // relative times are as of page load
  const h = useHistory(status)
  const excerpts = useExcerpts(h.items)

  // Items arrive newest first, so equal days are adjacent.
  const groups: { label: string; items: JobSummary[] }[] = []
  for (const j of h.items) {
    const label = dayLabel(j.created_at, now, locale, t)
    if (groups.at(-1)?.label === label) groups.at(-1)?.items.push(j)
    else groups.push({ label, items: [j] })
  }

  return (
    <section className="view">
      <div className="page-head">
        <div className="meta-row">
          <span>
            {t('history.ledger')} · <Mock label={t('history.session_scope')}>{t('history.session')}</Mock> · <Mock label={t('history.sync_state')}><strong className="sync">{t('history.synchronized')}</strong></Mock>
          </span>
        </div>
        <div className="toolbar">
          <div>
            <h1>{t('history.title')}</h1>
            <p>{t('history.lede')}</p>
          </div>
          <Mock label={t('history.export_label')}>
            <button type="button" className="btn-secondary" disabled>{t('history.export')}</button>
          </Mock>
        </div>
      </div>

      <Mock block label={t('history.search_label')}>
        <label className="search-lg">
          <span aria-hidden="true">⌕</span>
          <input type="search" disabled placeholder={t('history.search_placeholder')} aria-label={t('history.search_aria')} />
          <span className="kbd">⌘ K</span>
        </label>
      </Mock>

      <div className="filter-row" role="group" aria-label={t('history.filter.label')}>
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={f.status === status ? 'active' : undefined} aria-pressed={f.status === status} onClick={() => setStatus(f.status)}>
            {t(`history.filter.${f.key}`)}
          </button>
        ))}
      </div>

      {h.loading && <Skeleton />}
      {h.error && <ErrorAlert error={h.error} />}
      {!h.loading && !h.error && h.items.length === 0 && (
        status === undefined ? (
          <div className="card history-empty">
            <h3>{t('history.empty.title')}</h3>
            <p>{t('history.empty.text')}</p>
            <Link className="btn-primary" href="/">{t('history.empty.start')}</Link>
          </div>
        ) : (
          <div className="card history-empty"><h3>{t('history.empty.filtered')}</h3></div>
        )
      )}
      {groups.map((g) => (
        <div key={g.label}>
          <div className="day-label"><span>{g.label}</span><span>{t('history.analyses', { count: g.items.length })}</span></div>
          {g.items.map((j) => <Item key={j.id} job={j} excerpt={excerpts[j.id]} now={now} />)}
        </div>
      ))}
      {h.next && (
        <button type="button" className="btn-secondary load-more" disabled={h.more} onClick={h.loadMore}>
          {h.more ? t('history.loading') : t('history.load_more')}
        </button>
      )}
    </section>
  )
}
