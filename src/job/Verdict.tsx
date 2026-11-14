import { useState } from 'react'
import { verdictOf, type Job } from '../api/types'
import { Link } from '../router'
import { Mock } from '../ui/MockBadge'
import { readTechniques, techniqueName, timedOut, VERDICT_UI } from './read'

type Card = { tone: 'orange' | 'green' | 'purple' | 'blue' | 'gray'; pill: string; headline: string; sub?: string; verdict?: keyof typeof VERDICT_UI; insufficient?: boolean }

// Banner colour per verdict; History keeps its own tag tones in VERDICT_UI.
const BANNER = { detected: 'red', uncertain: 'orange', not_detected: 'green' } as const

const SKIPPED: Record<string, string> = {
  not_configured: 'No final assessment configured',
  disabled_by_request: 'Final assessment turned off for this job',
  cancelled: 'Final assessment cancelled',
}
const text = (v: unknown) => (typeof v === 'string' ? v : '')

// What the verdict card says for a job: job states first, then the finalization state.
function cardOf(job: Job): Card {
  if (job.status === 'failed') {
    const err = job.scrape?.status === 'failed' ? (job.scrape.error as { code?: unknown; message?: unknown } | null) : null
    if (err) return { tone: 'orange', pill: 'Scrape failed', headline: text(err.message), sub: `Error code: ${text(err.code)}` }
    return { tone: 'orange', pill: 'Analysis failed', headline: 'The analysis stopped because of an internal error.' }
  }
  if (job.status === 'cancelled')
    return { tone: 'gray', pill: 'Cancelled', headline: 'The analysis was cancelled. Results of analyzers that finished are kept below.' }
  const f = job.finalization
  const r = f?.result
  if (f?.status === 'completed' && r) {
    const verdict = verdictOf(r.verdict)
    return { tone: 'gray', pill: '', headline: VERDICT_UI[verdict].label, verdict, insufficient: r.produced_by === 'orchestrator' }
  }
  if (f?.status === 'skipped')
    return { tone: 'gray', pill: 'Final assessment skipped', headline: SKIPPED[text(f.reason)] ?? 'No final assessment was made.' }
  if (f?.status === 'failed')
    return { tone: 'orange', pill: 'Final assessment failed', headline: timedOut(f.error) ? 'Timed out' : text(f.error?.code) || 'Unknown error' }
  if (job.done) return { tone: 'gray', pill: 'No final assessment', headline: 'No final assessment is available for this job.' }
  return { tone: 'blue', pill: 'Final assessment in progress', headline: 'The analyzers are still working. This page updates automatically.' }
}

const TAG_TONES = ['orange', 'pink', 'purple']

export function Verdict({ job }: { job: Job }) {
  const [copied, setCopied] = useState(false)
  const card = cardOf(job)
  const techniques = readTechniques(job)?.detected ?? []
  const copy = () => navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true), () => undefined)
  return (
    <>
      <article className="card verdict-card">
        <div className="verdict-top">
          <div>
            {!card.verdict && (
              <span className={`status-pill ${card.tone}`}>
                <span aria-hidden="true">●</span>
                {card.pill}
              </span>
            )}
            <div className="verdict-sub">
              {card.insufficient && <span className="tag gray">Insufficient evidence</span>}
              {card.verdict === 'detected' && !card.insufficient && (
                <Mock label="Bias factor">High rhetorical bias factor</Mock>
              )}
            </div>
          </div>
        </div>
        {card.verdict ? (
          <div className={`verdict-banner ${BANNER[card.verdict]}`}>
            <h2>{card.headline}</h2>
          </div>
        ) : (
          <h2>{card.headline}</h2>
        )}
        {card.sub && <p className="verdict-body">{card.sub}</p>}
        {card.verdict && (
          <Mock block label="Polarity / Intensity">
            <div className="signal-row">
              <div className="signal-bar" aria-hidden="true"><span /><span /><span /></div>
              <span className="signal-text">Polarity: -0.84 · Intensity: 0.92</span>
            </div>
          </Mock>
        )}
        {techniques.length > 0 && (
          <div className="tags">
            {techniques.map((d, i) => (
              <span key={d.name} className={`tag ${TAG_TONES[i % TAG_TONES.length]}`}>{techniqueName(d)}</span>
            ))}
          </div>
        )}
        <div className="verdict-actions">
          <Link className="btn-primary" href={`/jobs/${encodeURIComponent(job.id)}/detail`}>Explore full analysis ↓</Link>
          <Link className="btn-link" href={`/explore?job=${encodeURIComponent(job.id)}`}>Explore coverage</Link>
          <span className="spacer" />
          <button type="button" className="icon-btn" aria-label={copied ? 'Copied' : 'Copy'} title="Copy link to this page" onClick={() => void copy()}>
            {copied ? '✓' : '⧉'}
          </button>
          <Mock label="Share">
            <button type="button" className="icon-btn" aria-label="Share">↗</button>
          </Mock>
        </div>
      </article>
      <Mock block label="Ask VEIL">
        <div className="card ask-cta">
          <div className="mark">V</div>
          <div className="copy">
            <strong>Have questions about this verdict or rhetorical triggers?</strong>
            <span>Ask VEIL to cross-reference with news wire reports and fact-checks.</span>
          </div>
          <Link className="btn-secondary" href="/ask">Open Ask VEIL Conversation ↗</Link>
        </div>
      </Mock>
    </>
  )
}
