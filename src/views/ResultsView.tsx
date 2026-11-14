import { useId, useState } from 'react'
import { verdictOf, type Job } from '../api/types'
import { useFormat, useLocale, useT } from '../i18n'
import { Coverage } from '../job/Coverage'
import { DetailedAnalysis } from '../job/DetailedAnalysis'
import { techniqueInfo, readTechniques } from '../job/read'
import { seconds } from '../job/text'
import { resultOf, Verdict } from '../job/Verdict'
import { WithJob } from '../job/WithJob'
import { Link } from '../router'
import { Mock } from '../ui/MockBadge'
import '../job/results.css'

const EXCERPT_MAX = 400

// "3.2 s" / "284 ms" (unit text from the catalog); null while the job is unfinished or the timestamps are unusable.
function duration(job: Job, t: ReturnType<typeof useT>, fmt: ReturnType<typeof useFormat>['formatNumber']): string | null {
  const ms = job.finished_at ? Date.parse(job.finished_at) - Date.parse(job.created_at) : NaN
  if (!(ms >= 0)) return null
  return ms < 1000 ? t('results.duration.ms', { v: fmt(Math.round(ms)) }) : seconds(t, fmt, 'results.duration.s', ms / 1000)
}

const TAG_TONES = ['orange', 'pink', 'purple']

// Everything below the verdict: collapsed by default and not rendered until opened.
function Detailed({ job, id }: { job: Job; id: string }) {
  const t = useT()
  const { locale } = useLocale()
  const { formatNumber } = useFormat()
  const [copied, setCopied] = useState(false)
  const content = typeof job.input?.content === 'string' ? job.input.content : ''
  const read = readTechniques(job)
  const techniques = read?.detected ?? []
  const r = resultOf(job)
  const copy = () => navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true), () => undefined)
  return (
    <div id={id} role="region" aria-label={t('results.detailed_region')} className="detailed-region">
      {content && (
        <div className="soft-card results-excerpt">
          <p className="quote-text">“<bdi dir="auto">{content.length > EXCERPT_MAX ? `${content.slice(0, EXCERPT_MAX)}…` : content}</bdi>”</p>
        </div>
      )}
      <div className="card detailed-summary">
        {r && verdictOf(r.verdict) === 'detected' && r.produced_by !== 'orchestrator' && (
          <div className="verdict-sub"><Mock label={t('results.mock.bias')}>{t('results.bias')}</Mock></div>
        )}
        {r && (
          <Mock block label={t('results.mock.polarity')}>
            <div className="signal-row">
              <div className="signal-bar" aria-hidden="true"><span /><span /><span /></div>
              <span className="signal-text">
                {t('results.polarity', { polarity: formatNumber(-0.84, { minimumFractionDigits: 2 }), intensity: formatNumber(0.92, { minimumFractionDigits: 2 }) })}
              </span>
            </div>
          </Mock>
        )}
        {techniques.length > 0 && (
          <div className="tags">
            {techniques.map((d, i) => (
              <span key={d.name} className={`tag ${TAG_TONES[i % TAG_TONES.length]}`}>{techniqueInfo(d, locale, read?.lang).name}</span>
            ))}
          </div>
        )}
        <div className="verdict-actions">
          <Link className="btn-link" href={`/explore?job=${encodeURIComponent(job.id)}`}>{t('results.explore')}</Link>
          <Link className="btn-link" href={`/jobs/${encodeURIComponent(job.id)}/detail`}>{t('results.open_detail')}</Link>
          <span className="spacer" />
          <button type="button" className="icon-btn" aria-label={copied ? t('results.copied') : t('results.copy')} title={t('results.copy_title')} onClick={() => void copy()}>
            {copied ? '✓' : '⧉'}
          </button>
          <Mock label={t('results.share')}>
            <button type="button" className="icon-btn" aria-label={t('results.share')}>↗</button>
          </Mock>
        </div>
      </div>
      <DetailedAnalysis job={job} />
      <Coverage job={job} />
    </div>
  )
}

function Results({ job }: { job: Job }) {
  const t = useT()
  const fmt = useFormat().formatNumber
  const [open, setOpen] = useState(false)
  const regionId = useId()
  const took = duration(job, t, fmt)
  return (
    <>
      <div className="meta-row results-meta">
        <span className="job-id">{t('results.job', { id: job.id })}</span>
        {took && <span>{t('results.duration', { value: took })}</span>}
        {!job.done && <Link className="btn-link" href={`/jobs/${encodeURIComponent(job.id)}/live`}>{t('results.watch_live')}</Link>}
      </div>
      <div className="results-stack">
        <Verdict job={job} />
        <div className="results-actions">
          <button type="button" className="btn-primary" aria-expanded={open} aria-controls={regionId} onClick={() => setOpen(!open)}>
            {open ? t('results.hide_detailed') : t('results.view_detailed')}
          </button>
          <Link className="btn-secondary" href="/ask">{t('results.ask')}</Link>
        </div>
        {open && <Detailed job={job} id={regionId} />}
      </div>
    </>
  )
}

export default function ResultsView({ id }: { id: string }) {
  const t = useT()
  return (
    <section className="view">
      <h1 className="sr-only">{t('results.title')}</h1>
      <WithJob id={id}>{(job) => <Results job={job} />}</WithJob>
    </section>
  )
}
