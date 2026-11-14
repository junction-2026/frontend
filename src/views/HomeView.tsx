import { useEffect, useState } from 'react'
import { createJob, listAnalyzers } from '../api/client'
import { errorMessage } from '../api/errors'
import type { AnalyzerInfo, ApiError, CreateJobBody } from '../api/types'
import { useT } from '../i18n'
import { navigate } from '../router'
import { AmbientBackground } from '../ui/AmbientBackground'
import '../styles/analyze.css'

const SAMPLES = ['energy', 'breaking', 'editorial']

const MAX_URL = 2048
type UrlProblem = 'home.url_too_long' | 'home.url_invalid'
function urlProblem(value: string): UrlProblem | null {
  if (value.length > MAX_URL) return 'home.url_too_long'
  try {
    const u = new URL(value)
    if (u.protocol === 'http:' || u.protocol === 'https:') return null
  } catch {
    /* falls through */
  }
  return 'home.url_invalid'
}

// Errors stay raw in state and are turned into text at render, so a language switch re-translates them.
type Problem = { url: UrlProblem } | { error: ApiError }
function describe(problem: Problem, t: ReturnType<typeof useT>): { message: string; items: string[] } {
  if ('url' in problem) return { message: t(problem.url, { max: MAX_URL }), items: [] }
  const { error } = problem
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
  const [listError, setListError] = useState<ApiError | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set())

  // The analyzers are fetched the first time the panel opens.
  useEffect(() => {
    if (!open || analyzers || listError) return
    let stale = false
    listAnalyzers().then((r) => {
      if (stale) return
      if (r.ok) setAnalyzers(r.data.items.filter((a) => a.selectable))
      else setListError(r.error)
    })
    return () => {
      stale = true
    }
  }, [open, analyzers, listError])

  const submit = async () => {
    if (busy || !value.trim()) return
    if (mode === 'link') {
      const bad = urlProblem(value.trim())
      if (bad) return setProblem({ url: bad })
    }
    const body: CreateJobBody = mode === 'text' ? { input: { content: value } } : { scrape: { url: value.trim() } }
    if (analyzers && unchecked.size) body.analyzers = analyzers.filter((a) => !unchecked.has(a.id)).map((a) => a.id)
    if (!isPublic) body.public = false
    setBusy(true)
    setProblem(null)
    const r = await createJob(body)
    setBusy(false)
    if (r.ok) {
      setIsPublic(true)
      navigate(`/jobs/${encodeURIComponent(r.data.id)}/live`)
    } else setProblem({ error: r.error })
  }

  const toggle = (id: string) =>
    setUnchecked((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const shown = problem && describe(problem, t)

  return (
    <>
    <AmbientBackground />
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
            dir="auto"
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
          {shown && (
            <div className="form-error" role="alert">
              {shown.message}
              {shown.items.length > 0 && <ul>{shown.items.map((i) => <li key={i}><bdi>{i}</bdi></li>)}</ul>}
            </div>
          )}
          <div className="visibility">
            <button type="button" role="switch" id="visibility-switch" className="switch" aria-checked={isPublic} aria-describedby="visibility-hint" onClick={() => setIsPublic((v) => !v)} />
            <label htmlFor="visibility-switch">{t('compose.visibility.label')}</label>
            <p id="visibility-hint" className="hint">{t('compose.visibility.hint')}</p>
          </div>
          <div className="composer-foot">
            <div className="composer-meta">
              <button type="button" className="btn-link" aria-expanded={open} aria-controls="advanced-options" onClick={() => setOpen((o) => !o)}>
                {t('home.advanced')}
              </button>
            </div>
            <div className="composer-actions">
              <span className="char-count">{t('home.chars', { count: value.length })}</span>
              <button type="button" className="btn-primary" disabled={busy || !value.trim()} onClick={() => void submit()}>{t('home.analyze')}<span aria-hidden="true" className="mirror-rtl"> ↵</span></button>
            </div>
          </div>
          {open && (
            <div className="advanced-panel" id="advanced-options">
              {listError && <div className="form-error" role="alert">{errorMessage(listError)}</div>}
              {!analyzers && !listError && <span>{t('home.analyzers_loading')}</span>}
              {analyzers?.map((a) => (
                <label key={a.id}>
                  <input type="checkbox" checked={!unchecked.has(a.id)} onChange={() => toggle(a.id)} />
                  <span><bdi>{a.name}</bdi></span>
                  <span className="badge-soft"><bdi>{a.category}</bdi></span>
                  {!a.enabled && <span className="hint">{t('home.analyzer_disabled')}</span>}
                </label>
              ))}
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

    </section>
    </>
  )
}
