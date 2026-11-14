import type { AnalyzerRun, Job } from '../api/types'
import { useT, useFormat } from '../i18n'
import { analyzerName, availabilityNote } from './activity'
import { timedOut } from './read'

const NOT_RUN = ['disabled', 'not_selected']
const str = (v: unknown) => (typeof v === 'string' ? v : '')

type T = ReturnType<typeof useT>

// Known statuses map to `results.analyzer.*`; an unknown one renders raw, an empty one reads as unknown.
function pill(a: AnalyzerRun, t: T): { tone: string; label: string } {
  switch (a.status) {
    case 'succeeded': return { tone: 'green', label: t('results.analyzer.succeeded') }
    case 'failed': return { tone: 'orange', label: timedOut(a.error) ? t('results.analyzer.timed_out') : t('results.analyzer.failed') }
    case 'skipped': return { tone: 'gray', label: t('results.analyzer.skipped') }
    case 'running': return { tone: 'blue', label: t('results.analyzer.running') }
    case 'pending': return { tone: 'blue', label: t('results.analyzer.pending') }
    default: return { tone: 'gray', label: str(a.status) || t('results.analyzer.unknown') }
  }
}

// null/ran: nothing to add; not_applicable as is; any other value counts as unavailable (availability is a tolerant enumeration).
const availability = (a: AnalyzerRun, t: T) =>
  a.availability == null || a.availability === 'ran' ? null : t(a.availability === 'not_applicable' ? 'results.availability.not_applicable' : 'results.availability.unavailable')

function Row({ a }: { a: AnalyzerRun }) {
  const t = useT()
  const p = pill(a, t)
  const av = availability(a, t)
  const note = availabilityNote(t, a) || (a.status === 'failed' ? str(a.error?.code) : '')
  return (
    <li className="analyzer-row">
      <div className="analyzer-main">
        <strong>{analyzerName(t, a)}</strong>
        {note && <span className="analyzer-note">{note}</span>}
      </div>
      {av && <span className="badge-soft">{av}</span>}
      <span className={`status-pill ${p.tone}`}>{p.label}</span>
    </li>
  )
}

export function Coverage({ job }: { job: Job }) {
  const t = useT()
  const { formatNumber: fmt } = useFormat()
  const c = job.coverage
  const runs = job.analyzers ?? []
  const notRun = runs.filter((a) => a.status === 'skipped' && NOT_RUN.includes(str(a.reason)))
  const shown = runs.filter((a) => !notRun.includes(a))
  const pct = c && c.total > 0 ? Math.min(100, (c.settled / c.total) * 100) : 0
  return (
    <section className="card coverage-card" aria-label={t('results.coverage')}>
      <h3>{t('results.coverage')}</h3>
      {c && (
        <>
          <p className="coverage-line">
            {t('results.coverage.line', { succeeded: fmt(c.succeeded), failed: fmt(c.failed), skipped: fmt(c.skipped), applicable: fmt(c.applicable) })}
          </p>
          <div className="bar coverage-bar" role="progressbar" aria-label={t('results.coverage.settled')} aria-valuemin={0} aria-valuemax={c.total} aria-valuenow={c.settled}>
            <span style={{ width: `${pct}%` }} />
          </div>
        </>
      )}
      <ul className="analyzer-list">
        {shown.map((a) => <Row key={a.id} a={a} />)}
      </ul>
      {notRun.length > 0 && (
        <details className="not-run">
          <summary>{t('results.coverage.not_run', { n: fmt(notRun.length) })}</summary>
          <ul className="analyzer-list">
            {notRun.map((a) => <Row key={a.id} a={a} />)}
          </ul>
        </details>
      )}
    </section>
  )
}
