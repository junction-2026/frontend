import { useEffect, useState } from 'react'
import { createJob, listAnalyzers } from '../api/client'
import { errorMessage } from '../api/errors'
import type { AnalyzerInfo, ApiError, CreateJobBody } from '../api/types'
import { navigate } from '../router'
import { Mock } from '../ui/MockBadge'
import '../styles/analyze.css'

const SAMPLES: [string, string][] = [
  ['Viral social claim on energy grid', "Everyone knows these people are destroying our future. We must act before it's too late!"],
  ['Breaking news rhetoric', 'Breaking: officials scramble as crisis deepens — sources say the public has been kept in the dark for months.'],
  ['Editorial framing comparison', 'While critics claim reform is urgent, a closer look at the numbers tells a quieter story about incentives and framing.'],
]

const FEATURES: [string, string, string][] = [
  ['Unbiased Dissection', 'Separates verified factual premises from manipulative rhetoric, tonal priming, and selective omission.', 'M12 3v18M5 8h4l2 8h2l2-8h4'],
  ['Provenance & Signals', 'Audits circular citations, origin attribution timelines, and automated coordination amplification patterns.', 'M8 10.8 10.3 7.7M13.7 7.7 16 10.8M6 12h.01M12 6h.01M18 12h.01'],
]

const MAX_URL = 2048
function urlProblem(value: string): string | null {
  if (value.length > MAX_URL) return `The link is longer than ${MAX_URL} characters.`
  try {
    const u = new URL(value)
    if (u.protocol === 'http:' || u.protocol === 'https:') return null
  } catch {
    /* falls through */
  }
  return 'Enter a full link starting with http:// or https://.'
}

type Problem = { message: string; items: string[] }
const problemOf = (error: ApiError): Problem => {
  const fields = error.code === 'validation_failed' ? error.details?.fields : undefined
  const items = fields && typeof fields === 'object' ? Object.entries(fields).map(([path, msg]) => `${path}: ${String(msg)}`) : []
  // The field list is rendered separately, so the headline uses the message without details.
  return { message: errorMessage(items.length ? { ...error, details: undefined } : error), items }
}

export default function HomeView() {
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
      const bad = urlProblem(value.trim())
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
        <div className="eyebrow"><span className="dot" /> AI Propaganda Detection &amp; Media Intelligence</div>
        <h1>See beyond the narrative.</h1>
        <p className="lede">Understand the techniques behind what you read.</p>

        <div className="card composer">
          <div className="composer-top">
            <div className="mode-tabs" role="tablist" aria-label="Input type">
              {([['text', 'Text'], ['link', 'Social Link']] as const).map(([m, label]) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? 'active' : undefined} onClick={() => { setMode(m); setProblem(null) }}>
                  {label}
                </button>
              ))}
            </div>
            <div className="support-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6" cy="12" r="2" /><circle cx="12" cy="6" r="2" /><circle cx="18" cy="12" r="2" /><path d="M8 11.2 10.4 7.8M14 7.8l2.2 3.2" /></svg>
              Supports Bluesky, Mastodon and web pages
            </div>
          </div>
          <label className="sr-only" htmlFor="analyze-input">Content to analyze</label>
          <textarea
            id="analyze-input"
            placeholder={mode === 'text' ? 'Paste text or a link to analyze...' : 'Paste the link of a post or web page...'}
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
              <Mock label="Language auto-detect"><span className="live">Auto-detect (EN, FR, AR, DE, FI)</span></Mock>
              <button type="button" className="btn-link" aria-expanded={open} aria-controls="advanced-options" onClick={() => setOpen((o) => !o)}>
                Advanced options ▾
              </button>
            </div>
            <div className="composer-actions">
              <span className="char-count">{value.length} chars</span>
              <button type="button" className="btn-primary" disabled={busy || !value.trim()} onClick={() => void submit()}>Analyze ↵</button>
            </div>
          </div>
          {open && (
            <div className="advanced-panel" id="advanced-options">
              {listError && <div className="form-error" role="alert">{listError}</div>}
              {!analyzers && !listError && <span>Loading analyzers…</span>}
              {analyzers?.map((a) => (
                <label key={a.id}>
                  <input type="checkbox" checked={!unchecked.has(a.id)} onChange={() => toggle(a.id)} />
                  <span>{a.name}</span>
                  <span className="badge-soft">{a.category}</span>
                  {!a.enabled && <span className="hint">disabled</span>}
                </label>
              ))}
              <label>
                <input type="checkbox" checked={finalize} onChange={(e) => setFinalize(e.target.checked)} />
                <span>Final assessment</span>
              </label>
            </div>
          )}
        </div>

        <p className="try-row">
          Try:{' '}
          {SAMPLES.map(([label, text], i) => (
            <span key={label}>
              {i > 0 && ' · '}
              <button type="button" onClick={() => { setMode('text'); setValue(text) }}>{label}</button>
            </span>
          ))}
        </p>
      </div>

      <div className="feature-grid">
        {FEATURES.map(([title, text, path]) => (
          <Mock key={title} block label={`Feature card: ${title}`}>
            <article className="card feature">
              <div className="feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={path} /></svg>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          </Mock>
        ))}
      </div>
    </section>
  )
}
