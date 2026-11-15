import { useEffect, useId, useRef, useState } from 'react'
import { useT } from '../../i18n'
import CodeBlock from './CodeBlock'
import { highlightJson } from './highlight'

type Op = 'create' | 'get'
type Shown =
  | { kind: 'network' }
  | { kind: 'response'; status: number; statusText: string; ms: number; body: string; json: boolean; retry: number | null }

const positiveInt = (v: unknown) => {
  const n = typeof v === 'string' && /^\s*\d+\s*$/.test(v) ? Number(v) : v
  return typeof n === 'number' && Number.isInteger(n) && n > 0 ? n : null
}
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

const validJson = (s: string) => {
  try {
    JSON.parse(s)
    return true
  } catch {
    return false
  }
}

// Calls the public analysis API of this origin (no credentials) when the user presses Send; never on render.
export default function Playground({ base, example }: { base: string; example: string }) {
  const t = useT()
  const uid = useId()
  const [op, setOp] = useState<Op>('create')
  const [body, setBody] = useState(example)
  const [id, setId] = useState('')
  const [busy, setBusy] = useState(false)
  const [shown, setShown] = useState<Shown | null>(null)
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])

  const endpoint = `${base}/public/analyses`
  const trimmed = id.trim()
  const url = op === 'create' ? endpoint : `${endpoint}/${trimmed ? encodeURIComponent(trimmed) : '<id>'}`
  const invalid = op === 'create' && !validJson(body)
  const canSend = !busy && (op === 'create' || trimmed !== '')

  const send = async () => {
    if (!canSend || abort.current) return
    const ctl = new AbortController()
    abort.current = ctl
    setBusy(true)
    const create = op === 'create'
    const init: RequestInit = create
      ? { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body, credentials: 'omit', signal: ctl.signal }
      : { method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit', signal: ctl.signal }
    const started = performance.now()
    try {
      const res = await fetch(url, init)
      const raw = await res.text()
      const ms = Math.round(performance.now() - started)
      if (ctl.signal.aborted) return
      let parsed: unknown
      let json = false
      try {
        parsed = JSON.parse(raw)
        json = true
      } catch {
        /* shown as plain text */
      }
      const details = isObj(parsed) && isObj(parsed.error) && isObj(parsed.error.details) ? parsed.error.details : {}
      const retry = res.status === 429 ? (positiveInt(res.headers.get('Retry-After')) ?? positiveInt(details.retry_after_s)) : null
      if (create && res.ok && isObj(parsed) && typeof parsed.id === 'string') setId(parsed.id)
      setShown({ kind: 'response', status: res.status, statusText: res.statusText, ms, body: json ? JSON.stringify(parsed, null, 2) : raw, json, retry })
    } catch {
      if (ctl.signal.aborted) return
      setShown({ kind: 'network' })
    } finally {
      abort.current = null
      if (!ctl.signal.aborted) setBusy(false)
    }
  }

  const sendButton = (
    <button type="button" className="btn-primary" disabled={!canSend} onClick={send}>
      {busy ? t('apiDocs.playground.sending') : t('apiDocs.playground.send')}
    </button>
  )
  const label = t('apiDocs.playground.response.title')

  return (
    <div className="api-playground">
      <p>{t('apiDocs.playground.text')}</p>
      <fieldset className="api-pg-ops">
        <legend>{t('apiDocs.playground.operation')}</legend>
        {(['create', 'get'] as const).map((o) => (
          <label key={o}>
            <input type="radio" name={`${uid}-op`} checked={op === o} onChange={() => setOp(o)} />
            {t(`apiDocs.playground.op.${o}`)}
          </label>
        ))}
      </fieldset>
      <p className="api-pg-url"><code dir="ltr">{op === 'create' ? 'POST' : 'GET'} {url}</code></p>

      {op === 'create' ? (
        <div className="api-pg-field">
          <label htmlFor={`${uid}-body`}>{t('apiDocs.playground.body')}</label>
          <textarea
            id={`${uid}-body`}
            dir="ltr"
            spellCheck={false}
            rows={9}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-invalid={invalid}
            aria-describedby={invalid ? `${uid}-invalid` : undefined}
          />
          {invalid && <p id={`${uid}-invalid`} className="api-pg-warn">{t('apiDocs.playground.invalid_json')}</p>}
          <div className="api-pg-actions">
            {sendButton}
            <button type="button" className="btn-secondary" onClick={() => setBody(example)}>{t('apiDocs.playground.reset')}</button>
          </div>
          <p className="api-pg-note">{t('apiDocs.playground.cost')}</p>
        </div>
      ) : (
        <div className="api-pg-field">
          <label htmlFor={`${uid}-id`}>{t('apiDocs.playground.id')}</label>
          <input id={`${uid}-id`} type="text" dir="ltr" spellCheck={false} autoComplete="off" value={id} onChange={(e) => setId(e.target.value)} />
          <div className="api-pg-actions">{sendButton}</div>
        </div>
      )}

      <div role="status" aria-live="polite" className="api-pg-summary">
        {shown?.kind === 'network' && t('apiDocs.playground.network')}
        {shown?.kind === 'response' && <>{t('apiDocs.playground.status')}: <code dir="ltr">{shown.status} {shown.statusText}</code></>}
      </div>
      {shown?.kind === 'response' && (
        <div className="api-pg-response">
          <p>{t('apiDocs.playground.elapsed')}: <code dir="ltr">{shown.ms} ms</code></p>
          {shown.retry !== null && <p>{t('apiDocs.playground.retry', { seconds: shown.retry })}</p>}
          {shown.body.trim() === '' ? (
            <p>{t('apiDocs.playground.empty')}</p>
          ) : (
            <>
              {!shown.json && <p>{t('apiDocs.playground.not_json')}</p>}
              <CodeBlock text={shown.body} label={label}>{shown.json ? highlightJson(shown.body) : undefined}</CodeBlock>
            </>
          )}
        </div>
      )}
    </div>
  )
}
