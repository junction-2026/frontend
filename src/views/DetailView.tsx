import type { Job } from '../api/types'
import JobView from '../job/JobView'
import { claimCount, readTechniques } from '../job/read'
import { WithJob } from '../job/WithJob'
import { Link } from '../router'
import { Mock } from '../ui/MockBadge'
import '../job/results.css'

function Detail({ job }: { job: Job }) {
  const patterns = readTechniques(job)?.detected.length
  const claims = claimCount(job)
  return (
    <>
      <div className="metrics-bar">
        <div><span>Patterns</span><strong>{patterns === undefined ? '—' : `${patterns} detected`}</strong></div>
        <div><span>Claims</span><strong>{claims === null ? '—' : `${claims} extracted`}</strong></div>
        <div>
          <span>Risk</span>
          <div className="metrics-mock">
            <Mock label="Risk"><span className="tag orange">High Risk</span></Mock>
          </div>
        </div>
        <div>
          <span>Latency</span>
          <div className="metrics-mock">
            <Mock label="Latency"><span className="metrics-latency">412ms</span></Mock>
          </div>
        </div>
      </div>
      <JobView job={job} />
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
