import { useId, useState } from 'react'
import { verdictOf, type Job } from '../api/types'
import { useFormat, useLocale, useT } from '../i18n'
import { useFocusPick } from './focusSelection'
import { userTextEntry, useLoc, useLocalizedText } from './localize'
import { timedOut } from './read'
import { summaryOf } from './summary'
import { percent } from './text'
import { botTextOf } from './botText'
import { cardsOf } from './verdictCards'

type Card = { tone: 'orange' | 'gray' | 'blue'; pill: string; headline: string; sub?: string }

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

// Small neutral pill: does this one text look generated? The score is P(bot_or_generated), so it only appears in the tooltip.
function OriginMarker({ origin }: { origin: NonNullable<ReturnType<typeof botTextOf>> }) {
  const t = useT()
  const { formatNumber } = useFormat()
  const id = useId()
  const [open, setOpen] = useState(false)
  const label = t(`results.origin.${origin.label}`)
  const tip = t('results.origin.tip', { pct: percent(formatNumber, origin.score) })
  return (
    <span className="confidence-info">
      <button
        type="button"
        className="verdict-origin"
        aria-label={`${label}. ${tip}`}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        {label}
      </button>
      {open && <span role="tooltip" id={id} className="confidence-tip">{tip}</span>}
    </span>
  )
}

// The summary sentence (with the localization note) and the "Read full explanation" disclosure with the complete text,
// which only exists when the text says more than the summary.
function useExplanation(original: string, fallback: string) {
  const t = useT()
  const { locale } = useLocale()
  const [open, setOpen] = useState(false)
  const id = useId()
  const { text: shown, note } = useLocalizedText(original, userTextEntry(useLoc()))
  const full = shown.trim()
  const summary = summaryOf(full, locale, fallback)
  const more = full !== '' && full !== summary
  return {
    summary: (
      <>
        <p className="verdict-summary" dir="auto">{summary}</p>
        {(summary !== fallback || open) && note}
      </>
    ),
    disclosure: more && (
      <div className="verdict-explanation">
        <button type="button" className="btn-link verdict-more" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
          {open ? t('results.hide_full') : t('results.read_full')}
        </button>
        {open && <p id={id} className="verdict-user-text" dir="auto">{full}</p>}
      </div>
    ),
  }
}

function Result({ job, r }: { job: Job; r: NonNullable<ReturnType<typeof resultOf>> }) {
  const t = useT()
  const { locale } = useLocale()
  const { formatNumber } = useFormat()
  const verdict = verdictOf(r.verdict)
  const partial = job.coverage?.failed > 0 || job.analyzers?.some((a) => a.status === 'failed')
  const cards = cardsOf(job, verdict, locale, t, formatNumber)
  const { summary, disclosure } = useExplanation(text(r.user_text), t(`results.verdict.${verdict}.body`))
  const origin = botTextOf(job)
  const insufficient = verdict === 'uncertain' && r.produced_by === 'orchestrator'
  const ask = useFocusPick()('final_assessment', 'final_assessment')
  return (
    <section className="verdict" data-verdict={verdict} data-focus-selected={ask?.selected || undefined}>
      <div className="verdict-head">
        <span className="verdict-pill">
          <span className="verdict-dot" aria-hidden="true" />
          {insufficient ? t('results.insufficient') : t(`results.verdict.${verdict}.pill`)}
        </span>
        <p className="verdict-confidence">
          <span>{confidenceText(r.confidence, t, formatNumber)}</span>
          <ConfidenceInfo />
          {origin && <OriginMarker origin={origin} />}
        </p>
        {ask?.button}
      </div>
      <h2>{t(`results.verdict.${verdict}.heading`)}</h2>
      {summary}
      {cards.length > 0 && (
        <ul className="verdict-cards">
          {cards.map((c) => (
            <li key={c.key} className="info-card" data-tone={c.neutral ? 'neutral' : 'verdict'}>
              <span className="info-card-label">{c.label}</span>
              <strong className="info-card-value">{c.value}</strong>
              {c.status && (
                <span className="info-card-status">
                  <span className="info-card-dot" aria-hidden="true" />
                  {c.status}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {disclosure}
      {partial && <p role="note" className="verdict-partial">{t('results.partial')}</p>}
    </section>
  )
}

export function Verdict({ job }: { job: Job }) {
  const t = useT()
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
  return <Result job={job} r={r} />
}
