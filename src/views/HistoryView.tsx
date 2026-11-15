import { useEffect, useState } from 'react'
import { verdictOf, type ApiError, type JobSummary } from '../api/types'
import { useLocale, useT } from '../i18n'
import { download, fetchAllJobs, toCsv } from '../history/exportCsv'
import { dayLabel, excerpt, relativeTime } from '../history/format'
import { useHistory } from '../history/useHistory'
import { VERDICT_UI } from '../job/read'
import { ErrorAlert, Skeleton } from '../job/WithJob'
import { Link } from '../router'
import '../job/results.css'
import '../history/history.css'

const FILTERS = [
  { key: 'all', status: undefined },
  { key: 'running', status: 'running' },
  { key: 'completed', status: 'completed' },
  { key: 'failed', status: 'failed' },
  { key: 'cancelled', status: 'cancelled' },
] as const

const STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled', 'skipped']

function statusTone(j: JobSummary) {
  if (j.status === 'failed') return 'orange'
  if (j.status === 'completed') return 'green'
  return j.done ? 'gray' : 'blue'
}

const DEBOUNCE_MS = 300

function Item({ job, now }: { job: JobSummary; now: number }) {
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
          <span><bdi>{job.id}</bdi></span>
          <span className={`status-pill ${statusTone(job)}`}>{status(job.status)}</span>
        </div>
        <h3>
          {job.excerpt ? <bdi>{`“${excerpt(job.excerpt)}”`}</bdi> : t('history.excerpt_unavailable')}
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
  const [text, setText] = useState('')
  const [q, setQ] = useState('') // the trimmed search the list is for
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<ApiError | null>(null)
  const h = useHistory(status, q)

  useEffect(() => {
    const id = setTimeout(() => setQ(text.trim()), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [text])

  async function exportCsv() {
    setExporting(true)
    setExportError(null)
    const r = await fetchAllJobs(status, q)
    if (r.ok) download(toCsv(r.data))
    else setExportError(r.error)
    setExporting(false)
  }

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
        <div className="toolbar">
          <div>
            <h1>{t('history.title')}</h1>
            <p>{t('history.lede')}</p>
          </div>
          <button type="button" className="btn-secondary" disabled={exporting} aria-busy={exporting} title={t('history.export_hint')} aria-description={t('history.export_hint')} onClick={() => void exportCsv()}>
            {exporting ? t('history.exporting') : t('history.export')}
          </button>
        </div>
      </div>

      <label className="search-lg">
        <span aria-hidden="true" className="mirror-rtl">⌕</span>
        <input type="search" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') setQ(text.trim()) }} placeholder={t('history.search_placeholder')} aria-label={t('history.search_aria')} />
        <span className="kbd">⌘ K</span>
      </label>
      {exportError && <ErrorAlert error={exportError} />}

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
        q !== '' ? (
          <div className="card history-empty"><h3>{t('history.empty.search', { query: q })}</h3></div>
        ) : status === undefined ? (
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
          {g.items.map((j) => <Item key={j.id} job={j} now={now} />)}
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
