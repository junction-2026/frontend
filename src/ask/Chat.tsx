import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { chatErrorMessage } from '../api/errors'
import { useFormat, useLocale, useT } from '../i18n'
import { Link } from '../router'
import { MAX_CHARS, useChat } from './useChat'

const Avatar = () => <div className="avatar-sm" aria-hidden="true">V</div>
const chars = (s: string) => Array.from(s)

// Why the composer is off, by the job's status (or the one a 409 reported).
export function blockedKey(status: string, done: boolean): string {
  return status === 'failed' || status === 'cancelled' || (done && status !== 'completed') ? 'ask.blocked.ended' : 'ask.blocked.active'
}

export function Chat({ id, status, done }: { id: string; status: string; done: boolean }) {
  const t = useT()
  const { locale } = useLocale()
  const { formatNumber } = useFormat()
  const { messages, truncated, pending, error, conflict, send, retry } = useChat(id, locale)
  const [draft, setDraft] = useState('')
  const countId = useId()
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'nearest' }) // braces: Chromium returns a Promise, which must not become the cleanup
  }, [messages.length, pending, error])

  const effective = conflict ?? status
  const blocked = effective !== 'completed'
  const submit = (text: string) => {
    if (blocked) return
    if (send(text)) setDraft('')
  }
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    e.preventDefault()
    submit(draft)
  }
  const suggestions = [t('ask.suggestion.1'), t('ask.suggestion.2')]

  return (
    <>
      <p className="chat-prompt">{t('ask.prompt')}</p>
      <div className="chat-thread" role="log" aria-label={t('ask.thread')}>
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div className="bubble-user" key={i} dir="auto">{m.content}</div>
          ) : (
            <div className="bubble-ai" key={i}>
              <Avatar />
              <div className="content"><p dir="auto">{m.content}</p></div>
            </div>
          ),
        )}
        {error && !blocked && (
          <div className="bubble-ai">
            <Avatar />
            <div className="content">
              <p role="alert" className="chat-error">{chatErrorMessage(error)}</p>
              <button type="button" className="btn-secondary" onClick={retry}>{t('ask.retry')}</button>
            </div>
          </div>
        )}
        <div ref={end} />
      </div>
      <div className="chat-status" role="status" aria-live="polite">{pending && t('ask.thinking')}</div>
      {truncated && <p className="chat-note">{t('ask.truncated')}</p>}
      {blocked && <p className="chat-note" role="note">{t(blockedKey(effective, done))}</p>}

      {!blocked && messages.length === 0 && (
        <div className="suggestions">
          {suggestions.map((s) => <button type="button" key={s} onClick={() => submit(s)} disabled={pending}>{s}</button>)}
          <Link className="accent" href={`/explore?job=${encodeURIComponent(id)}`}>{t('ask.suggestion.explore')}</Link>
        </div>
      )}

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); submit(draft) }}>
        <textarea
          aria-label={t('ask.input_aria')} aria-describedby={countId} rows={2} dir="auto" disabled={blocked}
          value={draft} placeholder={t('ask.input_placeholder')} onKeyDown={onKey}
          onChange={(e) => setDraft(chars(e.target.value).slice(0, MAX_CHARS).join(''))}
        />
        <bdi className="chat-count" id={countId}>{formatNumber(chars(draft).length)} / {formatNumber(MAX_CHARS)}</bdi>
        <button className="send-btn" type="submit" aria-label={t('ask.send')} disabled={blocked || pending || !draft.trim()}>↑</button>
      </form>
    </>
  )
}
