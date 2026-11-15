import { useRef, useState } from 'react'
import { verdictOf, type Job } from '../api/types'
import { Chat } from '../ask/Chat'
import { FocusPanel } from '../ask/FocusPanel'
import { focusItemsOf, MAX_FOCUS } from '../ask/focusItems'
import { useChat } from '../ask/useChat'
import { useLocale, useT } from '../i18n'
import { resultOf } from '../job/Verdict'
import { Skeleton, ErrorAlert } from '../job/WithJob'
import { useJob } from '../job/useJob'
import { Link } from '../router'
import '../secondary/secondary.css'
import '../ask/ask.css'

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
  const { locale } = useLocale()
  const result = useJob(id)
  const chat = useChat(id, locale)
  const [chosen, setChosen] = useState<string[]>([]) // element keys; component state only, not kept across reloads
  const heading = useRef<HTMLHeadingElement>(null)
  const job = result?.ok ? result.data : null
  const items = job ? focusItemsOf(job, locale, t) : []
  const picked = new Set(chosen)
  const focus = items.filter((i) => picked.has(i.key)).slice(0, MAX_FOCUS) // panel order; keys of vanished elements drop out
  const toggle = (key: string) => setChosen((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]))
  const choose = () => {
    heading.current?.scrollIntoView?.({ block: 'start' }) // absent in jsdom
    heading.current?.focus()
  }
  const completed = job?.status === 'completed'
  const disabled = !completed || (chat.conflict ?? job?.status) !== 'completed'
  return (
    <div className={job ? 'ask-split' : undefined}>
      <div className="ask-chat">
        {job && <ContextBar job={job} />}
        <div className="card chat-card">
          <ChatHead />
          {!result && <Skeleton />}
          {result && !result.ok && <ErrorAlert error={result.error} notFound={t('results.job_not_found')} />}
          {job && <Chat id={id} status={job.status} done={job.done === true} chat={chat} focus={focus} onRemove={toggle} onChoose={choose} />}
        </div>
      </div>
      {job && (
        <FocusPanel
          items={items} selected={new Set(focus.map((f) => f.key))} completed={completed} disabled={disabled}
          headingRef={heading} onToggle={toggle} onClear={() => setChosen([])}
        />
      )}
    </div>
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
