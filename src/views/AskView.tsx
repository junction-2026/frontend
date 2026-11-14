import { useState, type FormEvent } from 'react'
import { rich, useFormat, useT } from '../i18n'
import { Link } from '../router'
import { Mock } from '../ui/MockBadge'
import '../secondary/secondary.css'

const CORPUS_ID = '#CAT-FEAR-449' // mock identifier, not translated

// Mock: the thread is canned and sending only appends a local bubble; nothing is sent to the backend.
export default function AskView() {
  const t = useT()
  const { formatNumber } = useFormat()
  const label = t('ask.mock_label')
  const percent = (v: number) => formatNumber(v, { style: 'percent' })
  const suggestions = [t('ask.suggestion.1'), t('ask.suggestion.2')]
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState<string[]>([])

  const send = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setSent((s) => [...s, text])
    setDraft('')
  }

  return (
    <section className="view">
      <Mock block label={label}>
        <div className="context-bar">
          <div className="left">
            <span className="status-pill orange">{rich(t('ask.context.status'), { confidence: <bdi>{percent(0.94)}</bdi> })}</span>
            <h3>{t('ask.context.source')}</h3>
            <p>{t('ask.context.summary')}</p>
          </div>
          <Link className="btn-secondary" href="/history">{t('ask.back')}</Link>
        </div>
      </Mock>

      <div className="card chat-card">
        <div className="chat-head">
          <h1>{t('ask.title')} <span className="badge-blue">{t('ask.badge')}</span></h1>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('ask.grounded')}</span>
        </div>
        <p className="chat-prompt">{t('ask.prompt')}</p>

        <Mock block label={label}>
          <div className="chat-thread" role="log" aria-label={t('ask.thread')}>
            <div className="bubble-user">{t('ask.q1')}</div>
            <div className="bubble-ai">
              <div className="avatar-sm" aria-hidden="true">V</div>
              <div className="content">
                <p>{t('ask.a1_pre')}<strong>{rich(t('ask.a1_match'), { percent: <bdi>{percent(0.96)}</bdi> })}</strong>{t('ask.a1_post')}</p>
                <div className="meta-chips">
                  <span>{'{ }'} {rich(t('ask.chip.corpus'), { id: <bdi>{CORPUS_ID}</bdi> })}</span>
                  <span>{t('ask.chip.weight')}</span>
                </div>
              </div>
            </div>
            <div className="bubble-user">{t('ask.q2')}</div>
            <div className="bubble-ai">
              <div className="avatar-sm" aria-hidden="true">V</div>
              <div className="content">
                <p><strong>{t('ask.src.ft')}</strong>{t('ask.a2_and')}<strong>{t('ask.src.reuters')}</strong>{t('ask.a2_rest')}</p>
                <div className="ref-cards">
                  <Link className="ref-card" href="/explore">{t('ask.ref.related', { n: formatNumber(6) })} <span aria-hidden="true" className="mirror-rtl">↗</span></Link>
                  <button type="button" className="ref-card">{t('ask.ref.factcheck')} <span aria-hidden="true" className="mirror-rtl">↗</span></button>
                </div>
              </div>
            </div>
            {sent.map((text, i) => <div className="bubble-user" key={i} dir="auto">{text}</div>)}
          </div>
        </Mock>

        <Mock block label={label}>
          <div className="suggestions">
            {suggestions.map((s) => <button type="button" key={s} onClick={() => setDraft(s)}>{s}</button>)}
            <Link className="accent" href="/explore">{t('ask.suggestion.explore')}</Link>
          </div>
        </Mock>

        <Mock block label={label}>
          <form className="chat-input" onSubmit={send}>
            <input aria-label={t('ask.input_aria')} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t('ask.input_placeholder')} />
            <button className="send-btn" type="submit" aria-label={t('ask.send')}>↑</button>
          </form>
        </Mock>
      </div>
    </section>
  )
}
