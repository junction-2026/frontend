import type { AnalyzerRun, Job } from '../api/types'
import { timedOut } from './read'

const NOT_RUN = ['disabled', 'not_selected']
const str = (v: unknown) => (typeof v === 'string' ? v : '')

function pill(a: AnalyzerRun): { tone: string; label: string } {
  switch (a.status) {
    case 'succeeded': return { tone: 'green', label: 'Succeeded' }
    case 'failed': return timedOut(a.error) ? { tone: 'orange', label: 'Timed out' } : { tone: 'orange', label: 'Failed' }
    case 'skipped': return { tone: 'gray', label: 'Skipped' }
    case 'running': return { tone: 'blue', label: 'Running' }
    case 'pending': return { tone: 'blue', label: 'Pending' }
    default: return { tone: 'gray', label: str(a.status) || 'Unknown' }
  }
}

// null/ran: nothing to add; not_applicable as is; any other value counts as unavailable (availability is a tolerant enumeration).
const availability = (a: AnalyzerRun) =>
  a.availability == null || a.availability === 'ran' ? null : a.availability === 'not_applicable' ? 'Not applicable' : 'Unavailable'

function Row({ a }: { a: AnalyzerRun }) {
  const p = pill(a)
  const av = availability(a)
  const note = str(a.note) || (a.status === 'failed' ? str(a.error?.code) : '')
  return (
    <li className="analyzer-row">
      <div className="analyzer-main">
        <strong>{str(a.name) || str(a.id)}</strong>
        {note && <span className="analyzer-note">{note}</span>}
      </div>
      {av && <span className="badge-soft">{av}</span>}
      <span className={`status-pill ${p.tone}`}>{p.label}</span>
    </li>
  )
}

export function Coverage({ job }: { job: Job }) {
  const c = job.coverage
  const runs = job.analyzers ?? []
  const notRun = runs.filter((a) => a.status === 'skipped' && NOT_RUN.includes(str(a.reason)))
  const shown = runs.filter((a) => !notRun.includes(a))
  const pct = c && c.total > 0 ? Math.min(100, (c.settled / c.total) * 100) : 0
  return (
    <section className="card coverage-card" aria-label="Analyzer coverage">
      <h3>Analyzer coverage</h3>
      {c && (
        <>
          <p className="coverage-line">
            {c.succeeded} succeeded · {c.failed} failed · {c.skipped} skipped of {c.applicable} applicable
          </p>
          <div className="bar coverage-bar" role="progressbar" aria-label="Analyzers settled" aria-valuemin={0} aria-valuemax={c.total} aria-valuenow={c.settled}>
            <span style={{ width: `${pct}%` }} />
          </div>
        </>
      )}
      <ul className="analyzer-list">
        {shown.map((a) => <Row key={a.id} a={a} />)}
      </ul>
      {notRun.length > 0 && (
        <details className="not-run">
          <summary>Not run ({notRun.length})</summary>
          <ul className="analyzer-list">
            {notRun.map((a) => <Row key={a.id} a={a} />)}
          </ul>
        </details>
      )}
    </section>
  )
}
