import { useId, useState } from 'react'
import { verdictOf, type Job, type Verdict as VerdictState } from '../api/types'
import { timedOut } from './read'

type Card = { tone: 'orange' | 'gray' | 'blue'; pill: string; headline: string; sub?: string }

// Results has its own verdict copy; History keeps VERDICT_UI.
const COPY: Record<VerdictState, { heading: string; body: string }> = {
  detected: { heading: 'Yes, propaganda detected.', body: 'VEIL identified signs of manipulative messaging in this content.' },
  uncertain: { heading: "We're not sure yet.", body: 'The available evidence is insufficient or conflicting.' },
  not_detected: { heading: 'No clear signs of propaganda.', body: 'VEIL did not identify strong indicators of propaganda in this content.' },
}
const TOOLTIP =
  "How confident VEIL's final assessment is that this verdict is supported by the available evidence. It is not the probability that the content is propaganda."
const SHORT = 280

const SKIPPED: Record<string, string> = {
  not_configured: 'No final assessment configured',
  disabled_by_request: 'Final assessment turned off for this job',
  cancelled: 'Final assessment cancelled',
}
const text = (v: unknown) => (typeof v === 'string' ? v : '')

// The completed assessment of a job, or null while the Results screen shows a state card instead.
export function resultOf(job: Job) {
  const f = job.finalization
  return job.status !== 'failed' && job.status !== 'cancelled' && f?.status === 'completed' && f.result ? f.result : null
}

// What the neutral state card says: job states first, then the finalization state.
function cardOf(job: Job): Card {
  if (job.status === 'failed') {
    const err = job.scrape?.status === 'failed' ? (job.scrape.error as { code?: unknown; message?: unknown } | null) : null
    if (err) return { tone: 'orange', pill: 'Scrape failed', headline: text(err.message), sub: `Error code: ${text(err.code)}` }
    return { tone: 'orange', pill: 'Analysis failed', headline: 'The analysis stopped because of an internal error.' }
  }
  if (job.status === 'cancelled')
    return { tone: 'gray', pill: 'Cancelled', headline: 'The analysis was cancelled. Results of analyzers that finished are kept below.' }
  const f = job.finalization
  if (f?.status === 'skipped')
    return { tone: 'gray', pill: 'Final assessment skipped', headline: SKIPPED[text(f.reason)] ?? 'No final assessment was made.' }
  if (f?.status === 'failed')
    return { tone: 'orange', pill: 'Final assessment failed', headline: timedOut(f.error) ? 'Timed out' : text(f.error?.code) || 'Unknown error' }
  if (job.done)
    return { tone: 'gray', pill: 'No final assessment', headline: 'No final assessment is available for this job.' }
  return { tone: 'blue', pill: 'Final assessment in progress', headline: 'The analyzers are still working. This page updates automatically.' }
}

const confidenceText = (c: unknown) =>
  typeof c === 'number' && Number.isFinite(c) && c >= 0 && c <= 1 ? `${Math.round(c * 100)}% confidence` : 'Confidence unavailable'

function ConfidenceInfo() {
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <span className="confidence-info">
      <button
        type="button"
        className="info-btn"
        aria-label="What does confidence mean?"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        <span aria-hidden="true">i</span>
      </button>
      {open && <span role="tooltip" id={id} className="confidence-tip">{TOOLTIP}</span>}
    </span>
  )
}

function Explanation({ value }: { value: string }) {
  const [full, setFull] = useState(false)
  const chars = Array.from(value) // code points: a surrogate pair is never split
  const long = chars.length > SHORT
  return (
    <div className="verdict-explanation">
      <p className="verdict-user-text">{long && !full ? `${chars.slice(0, SHORT).join('')}…` : value}</p>
      {long && (
        <button type="button" className="btn-link" aria-expanded={full} onClick={() => setFull(!full)}>Show full explanation</button>
      )}
    </div>
  )
}

export function Verdict({ job }: { job: Job }) {
  const r = resultOf(job)
  if (!r) {
    const card = cardOf(job)
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
      {verdict === 'uncertain' && r.produced_by === 'orchestrator' && <span className="tag gray">Insufficient evidence</span>}
      <h2>{COPY[verdict].heading}</h2>
      <p className="verdict-lead">{COPY[verdict].body}</p>
      <p className="verdict-confidence">
        <span>{confidenceText(r.confidence)}</span>
        <ConfidenceInfo />
      </p>
      <Explanation value={text(r.user_text)} />
      {partial && <p role="note" className="verdict-partial">Some analyzers did not finish, so this result is based on partial evidence.</p>}
    </section>
  )
}
