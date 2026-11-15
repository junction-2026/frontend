import type { Job } from '../api/types'
import { useId, useState } from 'react'
import { useFormat, useT } from '../i18n'
import { ResultDetail } from '../job/ResultDetail'
import { duration } from '../job/text'
import { Verdict } from '../job/Verdict'
import { WithJob } from '../job/WithJob'
import { Link } from '../router'
import '../job/results.css'

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
          <Link className="btn-secondary" href={`/jobs/${encodeURIComponent(job.id)}/ask`}>{t('results.ask')}</Link>
        </div>
        {open && <ResultDetail job={job} id={regionId} />}
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
