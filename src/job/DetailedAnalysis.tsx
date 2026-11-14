import type { Job } from '../api/types'
import { Mock } from '../ui/MockBadge'
import JobView from './JobView'
import { claimCount, readTechniques } from './read'

// Metrics bar and JobView: the body shared by /jobs/:id/detail and the detailed region of /jobs/:id.
export function DetailedAnalysis({ job }: { job: Job }) {
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
