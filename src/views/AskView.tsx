import { useEffect, useRef, useState, type Ref } from 'react'
import { verdictOf, type Job } from '../api/types'
import { Chat } from '../ask/Chat'
import { focusItemsOf, MAX_FOCUS, type FocusEntry } from '../ask/focusItems'
import { useChat } from '../ask/useChat'
import { useFormat, useLocale, useT } from '../i18n'
import { FocusSelectionProvider } from '../job/focusSelection'
import { LocalizationProvider } from '../job/localize'
import { ResultDetail } from '../job/ResultDetail'
import { resultOf, Verdict } from '../job/Verdict'
import { Skeleton, ErrorAlert } from '../job/WithJob'
import { useJob } from '../job/useJob'
import { Link } from '../router'
import '../job/results.css'
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

// The result screen's Verdict and detailed region, always open, with a toggle on each element the chat can focus on.
function ResultPane({ job, items, selected, disabled, headingRef, onToggle, onSelectAll }: {
  job: Job; items: FocusEntry[]; selected: ReadonlySet<string>; disabled: boolean
  headingRef: Ref<HTMLHeadingElement>; onToggle: (key: string) => void; onSelectAll: (all: boolean) => void
}) {
  const t = useT()
  const { formatNumber } = useFormat()
  const completed = job.status === 'completed'
  const full = selected.size >= MAX_FOCUS
  const total = Math.min(items.length, MAX_FOCUS)
  const all = selected.size === total
  const allBox = useRef<HTMLInputElement>(null)
  useEffect(() => { if (allBox.current) allBox.current.indeterminate = selected.size > 0 && !all }, [selected.size, all])
  const selection = items.length > 0 ? { entries: new Map(items.map((i) => [i.key, i])), selected, full, disabled, toggle: onToggle } : null
  return (
    <section className="ask-result" role="region" aria-label={t('ask.focus.region')}>
      <div className="card ask-result-head">
        <h2 ref={headingRef} tabIndex={-1}>{t('ask.focus.title')}</h2>
        {completed && total > 0 && (
          <label className="focus-all">
            <input ref={allBox} type="checkbox" checked={all} disabled={disabled} onChange={() => onSelectAll(!all)} />
            {t('ask.focus.select_all')}
          </label>
        )}
        {!completed || !selection ? (
          <p className="chat-note" role="note">{t(completed ? 'ask.focus.empty' : 'ask.focus.not_completed')}</p>
        ) : (
          <p className="chat-note">{t('ask.focus.help')}</p>
        )}
        <p className="chat-note" role="status" aria-live="polite">{full && t('ask.focus.limit', { max: formatNumber(MAX_FOCUS) })}</p>
      </div>
      <FocusSelectionProvider value={selection}>
        <LocalizationProvider job={job}>
          <div className="results-stack">
            <Verdict job={job} />
            <ResultDetail job={job} />
          </div>
        </LocalizationProvider>
      </FocusSelectionProvider>
    </section>
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
  const keysOf = () => items.slice(0, MAX_FOCUS).map((i) => i.key)
  const [seeded, setSeeded] = useState(false) // default selection happens once per mount
  if (!seeded && job?.status === 'completed' && items.length > 0) { setSeeded(true); setChosen(keysOf()) }
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
          {job && <Chat id={id} status={job.status} done={job.done === true} chat={chat} focus={focus} total={items.length} onRemove={toggle} onChoose={choose} />}
        </div>
      </div>
      {job && (
        <ResultPane
          job={job} items={items} selected={new Set(focus.map((f) => f.key))} disabled={disabled}
          headingRef={heading} onToggle={toggle} onSelectAll={(all) => setChosen(all ? keysOf() : [])}
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
