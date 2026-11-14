import { useId, useState } from 'react'
import { verdictOf, type Job } from '../api/types'
import { Coverage } from '../job/Coverage'
import { DetailedAnalysis } from '../job/DetailedAnalysis'
import { techniqueName, readTechniques } from '../job/read'
import { resultOf, Verdict } from '../job/Verdict'
import { WithJob } from '../job/WithJob'
import { Link } from '../router'
import { Mock } from '../ui/MockBadge'
import '../job/results.css'

const EXCERPT_MAX = 400

// "3.2 s" / "284 ms"; null while the job is unfinished or the timestamps are unusable.
function duration(job: Job): string | null {
  const ms = job.finished_at ? Date.parse(job.finished_at) - Date.parse(job.created_at) : NaN
  if (!(ms >= 0)) return null
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`
}

const TAG_TONES = ['orange', 'pink', 'purple']

// Everything below the verdict: collapsed by default and not rendered until opened.
function Detailed({ job, id }: { job: Job; id: string }) {
  const [copied, setCopied] = useState(false)
  const content = typeof job.input?.content === 'string' ? job.input.content : ''
  const techniques = readTechniques(job)?.detected ?? []
  const r = resultOf(job)
  const copy = () => navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true), () => undefined)
  return (
    <div id={id} role="region" aria-label="Detailed analysis" className="detailed-region">
      {content && (
        <div className="soft-card results-excerpt">
          <p className="quote-text">“{content.length > EXCERPT_MAX ? `${content.slice(0, EXCERPT_MAX)}…` : content}”</p>
        </div>
      )}
      <div className="card detailed-summary">
        {r && verdictOf(r.verdict) === 'detected' && r.produced_by !== 'orchestrator' && (
          <div className="verdict-sub"><Mock label="Bias factor">High rhetorical bias factor</Mock></div>
        )}
        {r && (
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
          <Link className="btn-link" href={`/explore?job=${encodeURIComponent(job.id)}`}>Explore coverage</Link>
          <Link className="btn-link" href={`/jobs/${encodeURIComponent(job.id)}/detail`}>Open detailed analysis page</Link>
          <span className="spacer" />
          <button type="button" className="icon-btn" aria-label={copied ? 'Copied' : 'Copy'} title="Copy link to this page" onClick={() => void copy()}>
            {copied ? '✓' : '⧉'}
          </button>
          <Mock label="Share">
            <button type="button" className="icon-btn" aria-label="Share">↗</button>
          </Mock>
        </div>
      </div>
      <DetailedAnalysis job={job} />
      <Coverage job={job} />
    </div>
  )
}

function Results({ job }: { job: Job }) {
  const [open, setOpen] = useState(false)
  const regionId = useId()
  const took = duration(job)
  return (
    <>
      <div className="meta-row results-meta">
        <span className="job-id">Job {job.id}</span>
        {took && <span>Duration {took}</span>}
        {!job.done && <Link className="btn-link" href={`/jobs/${encodeURIComponent(job.id)}/live`}>Watch live progress</Link>}
      </div>
      <div className="results-stack">
        <Verdict job={job} />
        <div className="results-actions">
          <button type="button" className="btn-primary" aria-expanded={open} aria-controls={regionId} onClick={() => setOpen(!open)}>
            {open ? 'Hide detailed analysis' : 'View detailed analysis'}
          </button>
          <Link className="btn-secondary" href="/ask">Ask VEIL</Link>
        </div>
        {open && <Detailed job={job} id={regionId} />}
      </div>
    </>
  )
}

export default function ResultsView({ id }: { id: string }) {
  return (
    <section className="view">
      <h1 className="sr-only">Results</h1>
      <WithJob id={id}>{(job) => <Results job={job} />}</WithJob>
    </section>
  )
}
