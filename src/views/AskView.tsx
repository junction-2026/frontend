import { verdictOf, type Job } from '../api/types'
import { Chat } from '../ask/Chat'
import { useT } from '../i18n'
import { resultOf } from '../job/Verdict'
import { Skeleton, ErrorAlert } from '../job/WithJob'
import { useJob } from '../job/useJob'
import { Link } from '../router'
import '../secondary/secondary.css'

const TITLE_LEN = 120
const TONE = { detected: 'orange', not_detected: 'green', uncertain: 'purple' } as const

function ChatHead() {
  const t = useT()
  return (
    <div className="chat-head">
      <h1>{t('ask.title')} <span className="badge-blue">{t('ask.badge')}</span></h1>
      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('ask.grounded')}</span>
    </div>
  )
}

// The job under discussion: verdict label, source title or shortened input, link back to the result.
function ContextBar({ job }: { job: Job }) {
  const t = useT()
  const r = resultOf(job)
  const verdict = r && verdictOf(r.verdict)
  const content = job.input?.content ?? ''
  const title = job.input?.source?.title || (content.length > TITLE_LEN ? `${content.slice(0, TITLE_LEN).trimEnd()}…` : content) || t('ask.context.job', { id: job.id })
  return (
    <div className="context-bar">
      <div className="left">
        {verdict && <span className={`status-pill ${TONE[verdict]}`}>{t(`results.verdict.label.${verdict}`)}</span>}
        <h3 dir="auto">{title}</h3>
      </div>
      <Link className="btn-secondary" href={`/jobs/${encodeURIComponent(job.id)}`}>{t('ask.back')}</Link>
    </div>
  )
}

function JobChat({ id }: { id: string }) {
  const t = useT()
  const result = useJob(id)
  return (
    <>
      {result?.ok && <ContextBar job={result.data} />}
      <div className="card chat-card">
        <ChatHead />
        {!result && <Skeleton />}
        {result && !result.ok && <ErrorAlert error={result.error} notFound={t('results.job_not_found')} />}
        {result?.ok && <Chat id={id} status={result.data.status} done={result.data.done === true} />}
      </div>
    </>
  )
}

// /jobs/:id/ask chats about that job; plain /ask asks for an analysis first.
export default function AskView({ id }: { id: string }) {
  const t = useT()
  return (
    <section className="view">
      {id ? (
        <JobChat key={id} id={id} />
      ) : (
        <div className="card chat-card">
          <ChatHead />
          <h2>{t('ask.pick.title')}</h2>
          <p className="chat-prompt">{t('ask.pick.text')}</p>
          <Link className="btn-secondary" href="/history">{t('ask.pick.link')}</Link>
        </div>
      )}
    </section>
  )
}
