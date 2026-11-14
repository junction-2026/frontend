import { useEffect, useState } from 'react'
import { cancelJob } from '../api/client'
import { errorMessage } from '../api/errors'
import { ledgerRows } from '../analyze/state'
import { useJobStream } from '../analyze/useJobStream'
import { Link } from '../router'
import { Mock } from '../ui/MockBadge'
import '../styles/analyze.css'

// The router has no replace; it listens to popstate, so replaceState plus a popstate event re-renders the route.
function replaceTo(path: string) {
  window.history.replaceState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

function elapsed(from: string, to: number) {
  const s = Math.max(0, (to - Date.parse(from)) / 1000)
  if (Number.isNaN(s)) return null
  return s < 60 ? `${s.toFixed(1).padStart(4, '0')}s` : `${Math.floor(s / 60)}m ${(s % 60).toFixed(0).padStart(2, '0')}s`
}

const GLYPH = { green: '✓', blue: '…', orange: '!', gray: '–' } as const

type Cancel = { phase: 'idle' | 'cancelling' | 'finished'; error?: string }

function Live({ id }: { id: string }) {
  const { state, missing } = useJobStream(id)
  const [hidden, setHidden] = useState(false)
  const [cancel, setCancel] = useState<Cancel>({ phase: 'idle' })
  const [now, setNow] = useState(() => Date.now())
  const { job, terminal } = state
  const results = `/jobs/${encodeURIComponent(id)}`

  useEffect(() => {
    if (terminal === 'completed') replaceTo(results)
  }, [terminal, results])
  useEffect(() => {
    if (terminal || !job) return
    const t = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(t)
  }, [terminal, job])

  const doCancel = async () => {
    setCancel({ phase: 'idle' })
    const r = await cancelJob(id)
    if (r.ok) setCancel({ phase: 'cancelling' })
    else if (r.error.code === 'job_finished') {
      setCancel({ phase: 'finished' })
      replaceTo(results)
    } else setCancel({ phase: 'idle', error: errorMessage(r.error) })
  }

  if (missing)
    return <section className="view"><div className="form-error" role="alert">Analysis not found. It may have been removed.</div></section>

  const scrape = job?.scrape
  const scrapeFailure = scrape?.status === 'failed' && scrape.error && terminal !== 'cancelled' ? (scrape.error as { code?: string; message?: string }) : null
  const rows = scrapeFailure ? [] : ledgerRows(state)
  const p = state.progress
  const total = p?.total ?? 0
  const done = p?.done ?? 0
  const pct = total ? Math.min(100, (done / total) * 100) : 0
  const content = job?.input?.content ?? (typeof scrape?.url === 'string' ? scrape.url : '')
  const time = job ? elapsed(job.created_at, job.finished_at ? Date.parse(job.finished_at) : now) : null
  const running = (p?.running ?? []).map((r) => state.activities[r]).filter(Boolean)
  const phase = state.plan
    ? running.length ? running.map((a) => [a.text, a.detail].filter(Boolean).join(' ')).join(' · ') : 'Running the selected analyzers.'
    : [state.scrapeActivity?.text ?? (scrape ? 'Retrieving the linked content' : 'Starting the analysis'), state.scrapeActivity?.detail].filter(Boolean).join(' ')
  const heading = terminal === 'cancelled' ? 'Cancelled' : terminal === 'failed' ? 'Analysis failed' : 'Analyzing your content...'

  return (
    <section className="view">
      <div className="card quote-banner">
        <div className="meta-row">
          <span>Submitted content · Job {id}</span>
          {job && <span className="status-pill blue">● {state.status}</span>}
        </div>
        <p className="quote-text">{content ? `“${content}”` : '…'}</p>
        <div className="quote-foot">
          {time && <span>Elapsed: {time}</span>}
          <Mock label="Cluster"><span>Cluster: eu-west-alpha-2</span></Mock>
          <Mock label="Retention claim"><span>Zero-retention ephemeral pipeline</span></Mock>
        </div>
      </div>

      {scrapeFailure ? (
        <article className="card analyze-fail">
          <div className="meta-row"><span className="status-pill orange">Input Fault · {scrapeFailure.code}</span></div>
          <h3>Unable to retrieve social post</h3>
          <div className="fault-box">
            <div>{String(scrape?.url ?? '')}</div>
            <div className="err">⚠ {scrapeFailure.message}</div>
          </div>
          <Link className="btn-link" href="/">Switch to Text Input →</Link>
        </article>
      ) : (
        <>
          <div className="analyze-center">
            <div className={terminal ? 'progress-ring idle' : 'progress-ring'} aria-hidden="true">
              <svg viewBox="0 0 64 64"><circle className="track" cx="32" cy="32" r="24" /><circle className="arc" cx="32" cy="32" r="24" /></svg>
              <div className="core">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 14c3-6 13-6 16 0" /><path d="M8 18c2-3 6-3 8 0" /><circle cx="12" cy="8" r="2" /></svg>
              </div>
            </div>
            <h2>{heading}</h2>
            {terminal ? (
              <p>{terminal === 'cancelled' ? 'The analysis was stopped. Results that finished are kept.' : 'The analysis could not be completed.'}</p>
            ) : (
              <p>{phase}</p>
            )}
            <div className="bar" role="progressbar" aria-label="Analysis progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <div className="bar-meta">
              <span>{p ? `Stage ${done} of ${total} completed` : 'Waiting for the plan'}</span>
            </div>
            <div className="analyze-controls">
              {state.plan && (
                <button type="button" className="btn-secondary" aria-expanded={!hidden} onClick={() => setHidden((h) => !h)}>
                  {hidden ? 'Show' : 'Hide'} progress details ({done} of {total} completed) ▾
                </button>
              )}
              {terminal ? (
                <Link className="btn-link" href={results}>{terminal === 'cancelled' ? 'View partial results →' : 'View job →'}</Link>
              ) : cancel.phase === 'cancelling' ? (
                <span className="cancelling">Cancelling…</span>
              ) : cancel.phase === 'finished' ? (
                <span className="cancelling">The job already finished</span>
              ) : (
                <button type="button" className="btn-link" onClick={() => void doCancel()}>✕ Cancel analysis</button>
              )}
            </div>
            {cancel.error && <div className="form-error" role="alert">{cancel.error}</div>}
          </div>

          {state.plan && !hidden && (
            <div className="card ledger">
              <div className="ledger-head">
                <h3>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
                  Active Worker Ledger
                </h3>
                <Mock label="Pool description"><span>Synchronous consensus pool</span></Mock>
              </div>
              {rows.map((r, i) => (
                <div className="ledger-item" key={r.id}>
                  <div className={`check ${r.tone === 'blue' ? 'running' : r.tone === 'green' ? '' : r.tone}`} aria-hidden="true">{GLYPH[r.tone]}</div>
                  <div>
                    <h4><span className="num">{i + 1}.</span> {r.title}</h4>
                    {r.detail && <p>{r.detail}</p>}
                  </div>
                  <div className="ledger-right">
                    {r.ms !== null && <span>{(r.ms / 1000).toFixed(1)}s</span>}
                    <span className={`status-pill ${r.tone}`}>{r.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default function AnalyzingView({ id }: { id: string }) {
  return <Live key={id} id={id} />
}
