import { verdictOf, type Job } from '../api/types'
import { DetailedAnalysis } from '../job/DetailedAnalysis'
import { useT } from '../i18n'
import { WithJob } from '../job/WithJob'
import { Link } from '../router'
import '../job/results.css'

function Detail({ job }: { job: Job }) {
  const t = useT()
  const f = job.finalization
  const result = f?.status === 'completed' ? f.result : null
  return (
    <>
      {result && (
        <section className="card final-assessment">
          <h2>{t('results.detail.final')}</h2>
          <strong>{t(`results.verdict.label.${verdictOf(result.verdict)}`)}</strong>
          {result.produced_by === 'orchestrator' && <> <span className="tag gray">{t('results.insufficient')}</span></>}
          <p>{result.user_text}</p>
        </section>
      )}
      <DetailedAnalysis job={job} />
    </>
  )
}

export default function DetailView({ id }: { id: string }) {
  const t = useT()
  return (
    <section className="view">
      <div className="detail-top">
        <Link className="btn-link" href={`/jobs/${encodeURIComponent(id)}`}>{t('results.detail.back')}</Link>
        <span className="detail-id">{t('results.detail.label')} · <strong>{t('results.job', { id })}</strong></span>
      </div>
      <div className="page-head">
        <h1>{t('results.detail.title')}</h1>
        <p>{t('results.detail.lede')}</p>
      </div>
      <WithJob id={id}>{(job) => <Detail job={job} />}</WithJob>
    </section>
  )
}
