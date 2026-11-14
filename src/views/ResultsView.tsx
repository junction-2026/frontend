import type { Job } from '../api/types'
import { Coverage } from '../job/Coverage'
import { Verdict } from '../job/Verdict'
import { WithJob } from '../job/WithJob'
import { Link } from '../router'
import '../job/results.css'

const EXCERPT_MAX = 400

// "3.2 s" / "284 ms"; null while the job is unfinished or the timestamps are unusable.
function duration(job: Job): string | null {
  const ms = job.finished_at ? Date.parse(job.finished_at) - Date.parse(job.created_at) : NaN
  if (!(ms >= 0)) return null
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`
}

function Results({ job }: { job: Job }) {
  const content = typeof job.input?.content === 'string' ? job.input.content : ''
  const took = duration(job)
  return (
    <>
      <div className="meta-row results-meta">
        <span>● Analyzed excerpt</span>
        <span className="job-id">Job {job.id}</span>
        {took && <span>Duration {took}</span>}
        {!job.done && <Link className="btn-link" href={`/jobs/${encodeURIComponent(job.id)}/live`}>Watch live progress</Link>}
      </div>
      <div className="results-stack">
        {content && (
          <div className="soft-card results-excerpt">
            <p className="quote-text">“{content.length > EXCERPT_MAX ? `${content.slice(0, EXCERPT_MAX)}…` : content}”</p>
          </div>
        )}
        <Verdict job={job} />
        <Coverage job={job} />
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
