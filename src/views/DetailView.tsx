import { verdictOf, type Job } from '../api/types'
import { DetailedAnalysis } from '../job/DetailedAnalysis'
import { VERDICT_UI } from '../job/read'
import { WithJob } from '../job/WithJob'
import { Link } from '../router'
import '../job/results.css'

function Detail({ job }: { job: Job }) {
  const f = job.finalization
  const result = f?.status === 'completed' ? f.result : null
  return (
    <>
      {result && (
        <section className="card final-assessment">
          <h2>Final assessment</h2>
          <strong>{VERDICT_UI[verdictOf(result.verdict)].label}</strong>
          {result.produced_by === 'orchestrator' && <> <span className="tag gray">Insufficient evidence</span></>}
          <p>{result.user_text}</p>
        </section>
      )}
      <DetailedAnalysis job={job} />
    </>
  )
}

export default function DetailView({ id }: { id: string }) {
  return (
    <section className="view">
      <div className="detail-top">
        <Link className="btn-link" href={`/jobs/${encodeURIComponent(id)}`}>← Back to summary</Link>
        <span className="detail-id">Detailed analysis · <strong>Job {id}</strong></span>
      </div>
      <div className="page-head">
        <h1>Detailed analysis</h1>
        <p>Rhetorical techniques and claim units found in the submitted text, with the exact phrases that triggered them.</p>
      </div>
      <WithJob id={id}>{(job) => <Detail job={job} />}</WithJob>
    </section>
  )
}
