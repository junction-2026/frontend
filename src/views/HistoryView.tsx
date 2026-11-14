import { useState } from 'react'
import { verdictOf, type JobSummary } from '../api/types'
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
  { label: 'All', status: undefined },
  { label: 'Running', status: 'running' },
  { label: 'Completed', status: 'completed' },
  { label: 'Failed', status: 'failed' },
  { label: 'Cancelled', status: 'cancelled' },
] as const

function statusTone(j: JobSummary) {
  if (j.status === 'failed') return 'orange'
  if (j.status === 'completed') return 'green'
  return j.done ? 'gray' : 'blue'
}

function Item({ job, excerpt, now }: { job: JobSummary; excerpt: string | null | undefined; now: number }) {
  const verdict = job.finalization?.verdict
  const v = typeof verdict === 'string' ? VERDICT_UI[verdictOf(verdict)] : null
  return (
    <article className="card history-item">
      <div>
        <div className="top">
          <span>{job.id}</span>
          <span className={`status-pill ${statusTone(job)}`}>{job.status}</span>
        </div>
        <h3>
          {excerpt === undefined ? <span className="skeleton-line" aria-hidden="true" /> : excerpt === null ? 'Excerpt unavailable' : `“${excerpt}”`}
        </h3>
        <div className="tags">
          {v ? <span className={`tag ${v.tone}`}>{v.label}</span> : <span className="tag gray">Final assessment: {job.finalization?.status ?? 'unknown'}</span>}
        </div>
      </div>
      <div className="history-right">
        <span>{relativeTime(job.created_at, now)}</span>
        <Link className="btn-link" href={`/jobs/${encodeURIComponent(job.id)}`}>Reopen Analysis →</Link>
      </div>
    </article>
  )
}

export default function HistoryView() {
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [now] = useState(Date.now) // relative times are as of page load
  const h = useHistory(status)
  const excerpts = useExcerpts(h.items)

  // Items arrive newest first, so equal days are adjacent.
  const groups: { label: string; items: JobSummary[] }[] = []
  for (const j of h.items) {
    const label = dayLabel(j.created_at, now)
    if (groups.at(-1)?.label === label) groups.at(-1)?.items.push(j)
    else groups.push({ label, items: [j] })
  }

  return (
    <section className="view">
      <div className="page-head">
        <div className="meta-row">
          <span>
            Ledger index · <Mock label="Session scope">Workspace session local</Mock> · <Mock label="Sync state"><strong className="sync">Synchronized</strong></Mock>
          </span>
        </div>
        <div className="toolbar">
          <div>
            <h1>Analysis History</h1>
            <p>Browse and reopen your analysis jobs, newest first.</p>
          </div>
          <Mock label="Export">
            <button type="button" className="btn-secondary" disabled>↓ Export Ledger (JSON/CSV)</button>
          </Mock>
        </div>
      </div>

      <Mock block label="Search">
        <label className="search-lg">
          <span aria-hidden="true">⌕</span>
          <input type="search" disabled placeholder="Search analyses by keyword, verdict, or topic..." aria-label="Search analyses" />
          <span className="kbd">⌘ K</span>
        </label>
      </Mock>

      <div className="filter-row" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button key={f.label} type="button" className={f.status === status ? 'active' : undefined} aria-pressed={f.status === status} onClick={() => setStatus(f.status)}>
            {f.label}
          </button>
        ))}
      </div>

      {h.loading && <Skeleton />}
      {h.error && <ErrorAlert error={h.error} />}
      {!h.loading && !h.error && h.items.length === 0 && (
        status === undefined ? (
          <div className="card history-empty">
            <h3>No previous analyses yet</h3>
            <p>Analyses you run will be listed here so you can reopen them.</p>
            <Link className="btn-primary" href="/">Start first analysis</Link>
          </div>
        ) : (
          <div className="card history-empty"><h3>No analyses with this status</h3></div>
        )
      )}
      {groups.map((g) => (
        <div key={g.label}>
          <div className="day-label"><span>{g.label}</span><span>{g.items.length} {g.items.length === 1 ? 'analysis' : 'analyses'}</span></div>
          {g.items.map((j) => <Item key={j.id} job={j} excerpt={excerpts[j.id]} now={now} />)}
        </div>
      ))}
      {h.next && (
        <button type="button" className="btn-secondary load-more" disabled={h.more} onClick={h.loadMore}>
          {h.more ? 'Loading…' : 'Load more'}
        </button>
      )}
    </section>
  )
}
