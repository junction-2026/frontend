import { useId, useState } from 'react'
import { verdictOf, type Job } from '../api/types'
import { useFormat, useT } from '../i18n'
import { timedOut } from './read'
import { percent } from './text'

type Card = { tone: 'orange' | 'gray' | 'blue'; pill: string; headline: string; sub?: string }

const SHORT = 280

const SKIPPED = ['not_configured', 'disabled_by_request', 'cancelled']
const text = (v: unknown) => (typeof v === 'string' ? v : '')

// The completed assessment of a job, or null while the Results screen shows a state card instead.
export function resultOf(job: Job) {
  const f = job.finalization
  return job.status !== 'failed' && job.status !== 'cancelled' && f?.status === 'completed' && f.result ? f.result : null
}

type T = ReturnType<typeof useT>

// What the neutral state card says: job states first, then the finalization state. API messages and codes are shown as they come.
function cardOf(job: Job, t: T): Card {
  if (job.status === 'failed') {
    const err = job.scrape?.status === 'failed' ? (job.scrape.error as { code?: unknown; message?: unknown } | null) : null
    if (err) return { tone: 'orange', pill: t('results.card.scrape_failed'), headline: text(err.message), sub: t('results.card.error_code', { code: text(err.code) }) }
    return { tone: 'orange', pill: t('results.card.analysis_failed'), headline: t('results.card.internal_error') }
  }
  if (job.status === 'cancelled') return { tone: 'gray', pill: t('results.card.cancelled'), headline: t('results.card.cancelled_headline') }
  const f = job.finalization
  if (f?.status === 'skipped') {
    const reason = text(f.reason)
    return { tone: 'gray', pill: t('results.card.skipped'), headline: SKIPPED.includes(reason) ? t(`results.card.skipped.${reason}`) : t('results.card.skipped_other') }
  }
  if (f?.status === 'failed')
    return { tone: 'orange', pill: t('results.card.final_failed'), headline: timedOut(f.error) ? t('results.card.timed_out') : text(f.error?.code) || t('results.card.unknown_error') }
  if (job.done) return { tone: 'gray', pill: t('results.card.none'), headline: t('results.card.none_headline') }
  return { tone: 'blue', pill: t('results.card.in_progress'), headline: t('results.card.in_progress_headline') }
}

const confidenceText = (c: unknown, t: T, fmt: ReturnType<typeof useFormat>['formatNumber']) =>
  typeof c === 'number' && Number.isFinite(c) && c >= 0 && c <= 1 ? t('results.confidence', { pct: percent(fmt, c) }) : t('results.confidence_unavailable')

function ConfidenceInfo() {
  const t = useT()
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <span className="confidence-info">
      <button
        type="button"
        className="info-btn"
        aria-label={t('results.confidence_help')}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        <span aria-hidden="true">i</span>
      </button>
      {open && <span role="tooltip" id={id} className="confidence-tip">{t('results.confidence_tip')}</span>}
    </span>
  )
}

function Explanation({ value }: { value: string }) {
  const t = useT()
  const [full, setFull] = useState(false)
  const chars = Array.from(value) // code points: a surrogate pair is never split
  const long = chars.length > SHORT
  return (
    <div className="verdict-explanation">
      <p className="verdict-user-text">{long && !full ? `${chars.slice(0, SHORT).join('')}…` : value}</p>
      {long && (
        <button type="button" className="btn-link" aria-expanded={full} onClick={() => setFull(!full)}>{t('results.show_full')}</button>
      )}
    </div>
  )
}

export function Verdict({ job }: { job: Job }) {
  const t = useT()
  const { formatNumber } = useFormat()
  const r = resultOf(job)
  if (!r) {
    const card = cardOf(job, t)
    return (
      <article className="card verdict-card">
        <span className={`status-pill ${card.tone}`}>
          <span aria-hidden="true">●</span>
          {card.pill}
        </span>
        <h2>{card.headline}</h2>
        {card.sub && <p className="verdict-body">{card.sub}</p>}
      </article>
    )
  }
  const verdict = verdictOf(r.verdict)
  const partial = job.coverage?.failed > 0 || job.analyzers?.some((a) => a.status === 'failed')
  return (
    <section className="verdict" data-verdict={verdict}>
      {verdict === 'uncertain' && r.produced_by === 'orchestrator' && <span className="tag gray">{t('results.insufficient')}</span>}
      <h2>{t(`results.verdict.${verdict}.heading`)}</h2>
      <p className="verdict-lead">{t(`results.verdict.${verdict}.body`)}</p>
      <p className="verdict-confidence">
        <span>{confidenceText(r.confidence, t, formatNumber)}</span>
        <ConfidenceInfo />
      </p>
      <Explanation value={text(r.user_text)} />
      {partial && <p role="note" className="verdict-partial">{t('results.partial')}</p>}
    </section>
  )
}
