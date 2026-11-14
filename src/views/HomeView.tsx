import { useEffect, useState } from 'react'
import { createJob, listAnalyzers } from '../api/client'
import { errorMessage } from '../api/errors'
import type { AnalyzerInfo, ApiError, CreateJobBody } from '../api/types'
import { useT } from '../i18n'
import { navigate } from '../router'
import { Mock } from '../ui/MockBadge'
import '../styles/analyze.css'

const SAMPLES = ['energy', 'breaking', 'editorial']

const FEATURES: [string, string][] = [
  ['dissection', 'M12 3v18M5 8h4l2 8h2l2-8h4'],
  ['provenance', 'M8 10.8 10.3 7.7M13.7 7.7 16 10.8M6 12h.01M12 6h.01M18 12h.01'],
]

const MAX_URL = 2048
type T = ReturnType<typeof useT>
function urlProblem(value: string, t: T): string | null {
  if (value.length > MAX_URL) return t('home.url_too_long', { max: MAX_URL })
  try {
    const u = new URL(value)
    if (u.protocol === 'http:' || u.protocol === 'https:') return null
  } catch {
    /* falls through */
  }
  return t('home.url_invalid')
}

type Problem = { message: string; items: string[] }
const problemOf = (error: ApiError): Problem => {
  const fields = error.code === 'validation_failed' ? error.details?.fields : undefined
  const items = fields && typeof fields === 'object' ? Object.entries(fields).map(([path, msg]) => `${path}: ${String(msg)}`) : []
  // The field list is rendered separately, so the headline uses the message without details.
  return { message: errorMessage(items.length ? { ...error, details: undefined } : error), items }
}

export default function HomeView() {
  const t = useT()
  const [mode, setMode] = useState<'text' | 'link'>('text')
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [open, setOpen] = useState(false)
  const [analyzers, setAnalyzers] = useState<AnalyzerInfo[] | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set())
  const [finalize, setFinalize] = useState(true)

  // The analyzers are fetched the first time the panel opens.
  useEffect(() => {
    if (!open || analyzers || listError) return
    let stale = false
    listAnalyzers().then((r) => {
      if (stale) return
      if (r.ok) setAnalyzers(r.data.items.filter((a) => a.selectable))
      else setListError(errorMessage(r.error))
    })
    return () => {
      stale = true
    }
  }, [open, analyzers, listError])

  const submit = async () => {
    if (busy || !value.trim()) return
    if (mode === 'link') {
      const bad = urlProblem(value.trim(), t)
      if (bad) return setProblem({ message: bad, items: [] })
    }
    const body: CreateJobBody = mode === 'text' ? { input: { content: value } } : { scrape: { url: value.trim() } }
    if (analyzers && unchecked.size) body.analyzers = analyzers.filter((a) => !unchecked.has(a.id)).map((a) => a.id)
    if (!finalize) body.options = { finalize: false }
    setBusy(true)
    setProblem(null)
    const r = await createJob(body)
    setBusy(false)
    if (r.ok) navigate(`/jobs/${encodeURIComponent(r.data.id)}/live`)
    else setProblem(problemOf(r.error))
  }

  const toggle = (id: string) =>
    setUnchecked((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  return (
    <section className="view">
      <div className="home-hero">
        <div className="eyebrow"><span className="dot" /> {t('home.eyebrow')}</div>
        <h1>{t('home.title')}</h1>
        <p className="lede">{t('home.lede')}</p>

        <div className="card composer">
          <div className="composer-top">
            <div className="mode-tabs" role="tablist" aria-label={t('home.mode.label')}>
              {(['text', 'link'] as const).map((m) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? 'active' : undefined} onClick={() => { setMode(m); setProblem(null) }}>
                  {t(`home.mode.${m}`)}
                </button>
              ))}
            </div>
            <div className="support-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6" cy="12" r="2" /><circle cx="12" cy="6" r="2" /><circle cx="18" cy="12" r="2" /><path d="M8 11.2 10.4 7.8M14 7.8l2.2 3.2" /></svg>
              {t('home.support_note')}
            </div>
          </div>
          <label className="sr-only" htmlFor="analyze-input">{t('home.input_label')}</label>
          <textarea
            id="analyze-input"
            placeholder={t(`home.placeholder_${mode}`)}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                void submit()
              }
            }}
          />
          {problem && (
            <div className="form-error" role="alert">
              {problem.message}
              {problem.items.length > 0 && <ul>{problem.items.map((i) => <li key={i}>{i}</li>)}</ul>}
            </div>
          )}
          <div className="composer-foot">
            <div className="composer-meta">
              <button type="button" className="btn-link" aria-expanded={open} aria-controls="advanced-options" onClick={() => setOpen((o) => !o)}>
                {t('home.advanced')}
              </button>
            </div>
            <div className="composer-actions">
              <span className="char-count">{t('home.chars', { count: value.length })}</span>
              <button type="button" className="btn-primary" disabled={busy || !value.trim()} onClick={() => void submit()}>{t('home.analyze')}</button>
            </div>
          </div>
          {open && (
            <div className="advanced-panel" id="advanced-options">
              {listError && <div className="form-error" role="alert">{listError}</div>}
              {!analyzers && !listError && <span>{t('home.analyzers_loading')}</span>}
              {analyzers?.map((a) => (
                <label key={a.id}>
                  <input type="checkbox" checked={!unchecked.has(a.id)} onChange={() => toggle(a.id)} />
                  <span>{a.name}</span>
                  <span className="badge-soft">{a.category}</span>
                  {!a.enabled && <span className="hint">{t('home.analyzer_disabled')}</span>}
                </label>
              ))}
              <label>
                <input type="checkbox" checked={finalize} onChange={(e) => setFinalize(e.target.checked)} />
                <span>{t('home.final_assessment')}</span>
              </label>
            </div>
          )}
        </div>

        <p className="try-row">
          {t('home.try')}{' '}
          {SAMPLES.map((s, i) => (
            <span key={s}>
              {i > 0 && ' · '}
              <button type="button" onClick={() => { setMode('text'); setValue(t(`home.sample.${s}.text`)) }}>{t(`home.sample.${s}.label`)}</button>
            </span>
          ))}
        </p>
      </div>

      <div className="feature-grid">
        {FEATURES.map(([id, path]) => (
          <Mock key={id} block label={t('home.feature_card', { title: t(`home.feature.${id}.title`) })}>
            <article className="card feature">
              <div className="feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={path} /></svg>
              </div>
              <h3>{t(`home.feature.${id}.title`)}</h3>
              <p>{t(`home.feature.${id}.text`)}</p>
            </article>
          </Mock>
        ))}
      </div>
    </section>
  )
}
