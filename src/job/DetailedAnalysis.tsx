import type { Job } from '../api/types'
import { useFormat, useT } from '../i18n'
import JobView from './JobView'
import { RiskMetric } from './RiskScore'
import { claimCount, readTechniques } from './read'
import { duration } from './text'

// Metrics bar and JobView: the body of the detailed region of /jobs/:id.
export function DetailedAnalysis({ job }: { job: Job }) {
  const t = useT()
  const { formatNumber: fmt } = useFormat()
  const patterns = readTechniques(job)?.detected.length
  const claims = claimCount(job)
  const latency = duration(job, t, fmt)
  return (
    <>
      <div className="metrics-bar">
        <div><span>{t('results.metrics.patterns')}</span><strong>{patterns === undefined ? '—' : t('results.metrics.detected', { n: fmt(patterns) })}</strong></div>
        <div><span>{t('results.metrics.claims')}</span><strong>{claims === null ? '—' : t('results.metrics.extracted', { n: fmt(claims) })}</strong></div>
        <div><span>{t('results.metrics.risk')}</span><RiskMetric job={job} /></div>
        <div><span>{t('results.metrics.latency')}</span><strong>{latency ?? '—'}</strong></div>
      </div>
      <JobView job={job} />
    </>
  )
}
