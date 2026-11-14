import { useEffect, useState } from 'react'
import { cancelJob } from '../api/client'
import { errorMessage } from '../api/errors'
import type { ApiError } from '../api/types'
import { ledgerRows } from '../analyze/state'
import { useJobStream } from '../analyze/useJobStream'
import { useFormat, useT } from '../i18n'
import { enumLabel, seconds } from '../job/text'
import { Link } from '../router'
import { Mock } from '../ui/MockBadge'
import '../styles/analyze.css'

// The router has no replace; it listens to popstate, so replaceState plus a popstate event re-renders the route.
function replaceTo(path: string) {
  window.history.replaceState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

type T = ReturnType<typeof useT>
type Fmt = ReturnType<typeof useFormat>['formatNumber']

function elapsed(from: string, to: number, t: T, fmt: Fmt) {
  const s = Math.max(0, (to - Date.parse(from)) / 1000)
  if (Number.isNaN(s)) return null
  const two = { minimumIntegerDigits: 2 }
  if (s < 60) return seconds(t, fmt, 'analysis.time.s', s, two)
  return `${t('analysis.time.m', { v: fmt(Math.floor(s / 60)) })} ${t('analysis.time.s', { v: fmt(Math.round(s % 60), two) })}`
}

const GLYPH = { green: '✓', blue: '…', orange: '!', gray: '–' } as const

// The error stays raw and is turned into text at render, so a language switch re-translates it.
type Cancel = { phase: 'idle' | 'cancelling' | 'finished'; error?: ApiError }

function Live({ id }: { id: string }) {
  const t = useT()
  const { formatNumber: fmt } = useFormat()
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
    const timer = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(timer)
  }, [terminal, job])

  const doCancel = async () => {
    setCancel({ phase: 'idle' })
    const r = await cancelJob(id)
    if (r.ok) setCancel({ phase: 'cancelling' })
    else if (r.error.code === 'job_finished') {
      setCancel({ phase: 'finished' })
      replaceTo(results)
    } else setCancel({ phase: 'idle', error: r.error })
  }

  if (missing)
    return <section className="view"><div className="form-error" role="alert">{t('analysis.not_found')}</div></section>

  const scrape = job?.scrape
  const scrapeFailure = scrape?.status === 'failed' && scrape.error && terminal !== 'cancelled' ? (scrape.error as { code?: string; message?: string }) : null
  const rows = scrapeFailure ? [] : ledgerRows(state)
  const p = state.progress
  const total = p?.total ?? 0
  const done = p?.done ?? 0
  const pct = total ? Math.min(100, (done / total) * 100) : 0
  const content = job?.input?.content ?? (typeof scrape?.url === 'string' ? scrape.url : '')
  const time = job ? elapsed(job.created_at, job.finished_at ? Date.parse(job.finished_at) : now, t, fmt) : null
  const running = (p?.running ?? []).map((r) => state.activities[r]).filter(Boolean)
  const phase = state.plan
    ? running.length ? running.map((a) => [a.text, a.detail].filter(Boolean).join(' ')).join(' · ') : t('analysis.phase.selected')
    : [state.scrapeActivity?.text ?? (scrape ? t('analysis.phase.retrieving') : t('analysis.phase.starting')), state.scrapeActivity?.detail].filter(Boolean).join(' ')
  const heading = terminal === 'cancelled' ? t('analysis.heading.cancelled') : terminal === 'failed' ? t('analysis.heading.failed') : t('analysis.heading.running')

  return (
    <section className="view">
      <div className="card quote-banner">
        <div className="meta-row">
          <span>{t('analysis.submitted', { id })}</span>
          {job && <span className="status-pill blue">● {enumLabel(t, 'analysis.job_status', state.status)}</span>}
        </div>
        <p className="quote-text">{content ? `“${content}”` : '…'}</p>
        <div className="quote-foot">
          {time && <span>{t('analysis.elapsed', { time })}</span>}
          <Mock label={t('analysis.mock.cluster')}><span>{t('analysis.cluster')}</span></Mock>
          <Mock label={t('analysis.mock.retention')}><span>{t('analysis.retention')}</span></Mock>
        </div>
      </div>

      {scrapeFailure ? (
        <article className="card analyze-fail">
          <div className="meta-row"><span className="status-pill orange">{t('analysis.fault.pill', { code: String(scrapeFailure.code) })}</span></div>
          <h3>{t('analysis.fault.title')}</h3>
          <div className="fault-box">
            <div>{String(scrape?.url ?? '')}</div>
            <div className="err">⚠ {scrapeFailure.message}</div>
          </div>
          <Link className="btn-link" href="/">{t('analysis.fault.switch')}</Link>
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
              <p>{terminal === 'cancelled' ? t('analysis.body.cancelled') : t('analysis.body.failed')}</p>
            ) : (
              <p>{phase}</p>
            )}
            <div className="bar" role="progressbar" aria-label={t('analysis.progress')} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <div className="bar-meta">
              <span>{p ? t('analysis.stage', { done: fmt(done), total: fmt(total) }) : t('analysis.waiting_plan')}</span>
            </div>
            <div className="analyze-controls">
              {state.plan && (
                <button type="button" className="btn-secondary" aria-expanded={!hidden} onClick={() => setHidden((h) => !h)}>
                  {t(hidden ? 'analysis.details.show' : 'analysis.details.hide', { done: fmt(done), total: fmt(total) })}
                </button>
              )}
              {terminal ? (
                <Link className="btn-link" href={results}>{terminal === 'cancelled' ? t('analysis.view_partial') : t('analysis.view_job')}</Link>
              ) : cancel.phase === 'cancelling' ? (
                <span className="cancelling">{t('analysis.cancelling')}</span>
              ) : cancel.phase === 'finished' ? (
                <span className="cancelling">{t('analysis.already_finished')}</span>
              ) : (
                <button type="button" className="btn-link" onClick={() => void doCancel()}>{t('analysis.cancel')}</button>
              )}
            </div>
            {cancel.error && <div className="form-error" role="alert">{errorMessage(cancel.error)}</div>}
          </div>

          {state.plan && !hidden && (
            <div className="card ledger">
              <div className="ledger-head">
                <h3>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
                  {t('analysis.ledger.title')}
                </h3>
                <Mock label={t('analysis.mock.pool')}><span>{t('analysis.pool')}</span></Mock>
              </div>
              {rows.map((r, i) => (
                <div className="ledger-item" key={r.id}>
                  <div className={`check ${r.tone === 'blue' ? 'running' : r.tone === 'green' ? '' : r.tone}`} aria-hidden="true">{GLYPH[r.tone]}</div>
                  <div>
                    <h4><span className="num">{fmt(i + 1)}.</span> {r.title}</h4>
                    {r.detail && <p>{r.detail}</p>}
                  </div>
                  <div className="ledger-right">
                    {r.ms !== null && <span>{seconds(t, fmt, 'analysis.time.s', r.ms / 1000)}</span>}
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
