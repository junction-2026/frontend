import type { Job } from '../api/types'
import { useFormat, useT } from '../i18n'
import { Mock } from '../ui/MockBadge'
import JobView from './JobView'
import { RiskMetric } from './RiskScore'
import { claimCount, readTechniques } from './read'

// Metrics bar and JobView: the body shared by /jobs/:id/detail and the detailed region of /jobs/:id.
export function DetailedAnalysis({ job }: { job: Job }) {
  const t = useT()
  const { formatNumber: fmt } = useFormat()
  const patterns = readTechniques(job)?.detected.length
  const claims = claimCount(job)
  return (
    <>
      <div className="metrics-bar">
        <div><span>{t('results.metrics.patterns')}</span><strong>{patterns === undefined ? '—' : t('results.metrics.detected', { n: fmt(patterns) })}</strong></div>
        <div><span>{t('results.metrics.claims')}</span><strong>{claims === null ? '—' : t('results.metrics.extracted', { n: fmt(claims) })}</strong></div>
        <div><span>{t('results.metrics.risk')}</span><RiskMetric job={job} /></div>
        <div>
          <span>{t('results.metrics.latency')}</span>
          <div className="metrics-mock">
            <Mock label={t('results.metrics.latency')}><span className="metrics-latency">{t('results.metrics.latency_value', { v: fmt(412) })}</span></Mock>
          </div>
        </div>
      </div>
      <JobView job={job} />
    </>
  )
}
