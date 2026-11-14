import type { AnalyzerRun, Finalization, Job, JobEvent } from '../api/types'

export type PlanEntry = { id: string; name: string; activity_key: string; depends_on: string[]; phase: number }
export type Activity = { key: string; text: string; detail: string | null; params: Record<string, unknown> }
export type Progress = { done: number; running: string[]; total: number }
export type Terminal = 'completed' | 'cancelled' | 'failed'

export type State = {
  seq: number
  job: Job | null
  status: string
  plan: PlanEntry[] | null
  progress: Progress | null
  runs: Record<string, AnalyzerRun>
  activities: Record<string, Activity>
  previews: Record<string, Record<string, unknown>>
  finalization: Finalization | null
  scrapeActivity: Activity | null
  terminal: Terminal | null
}

export const initialState: State = {
  seq: 0, job: null, status: 'queued', plan: null, progress: null, runs: {}, activities: {}, previews: {},
  finalization: null, scrapeActivity: null, terminal: null,
}

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v) // eslint-disable-line @typescript-eslint/no-explicit-any
const isProgress = (v: unknown): v is Progress => isObj(v) && typeof v.done === 'number' && typeof v.total === 'number'
const isActivity = (v: unknown): v is Activity => isObj(v) && typeof v.text === 'string'
const terminalOf = (job: Job): Terminal | null => (!job.done ? null : job.status === 'completed' ? 'completed' : job.status === 'cancelled' ? 'cancelled' : 'failed')

const runsOf = (job: Job) => Object.fromEntries((job.analyzers ?? []).map((a) => [a.id, a]))

// Synthetic plan for a job whose plan event was never seen (polling fallback): every analyzer that was not skipped at creation.
function planFromJob(job: Job): PlanEntry[] {
  return (job.analyzers ?? [])
    .filter((a) => !(a.status === 'skipped' && (a.reason === 'disabled' || a.reason === 'not_selected')))
    .map((a) => ({ id: a.id, name: a.name, activity_key: a.id, depends_on: a.depends_on ?? [], phase: 1 }))
}

// Fills from a Job fetched over REST (polling fallback). A plan or progress already known from events is kept.
export function applyJob(s: State, job: Job): State {
  const plan = s.plan ?? planFromJob(job)
  const settled = plan.filter((p) => ['succeeded', 'failed', 'skipped'].includes(job.analyzers.find((a) => a.id === p.id)?.status ?? '')).length
  return {
    ...s, job, status: job.status, plan, runs: runsOf(job), finalization: job.finalization, terminal: terminalOf(job),
    progress: s.plan ? s.progress : { done: settled, running: [], total: plan.length },
  }
}

// Applies one event. An event that is not newer than the last applied one is ignored, so a late Progress never moves
// the bar back; job.snapshot always resets (a reconnect delivers a fresh one).
export function applyEvent(s: State, e: JobEvent): State {
  const d = e.data ?? {}
  if (e.type === 'job.snapshot') {
    const job = d.job as Job | undefined
    if (!isObj(job)) return s
    const plan = isObj(d.plan) && Array.isArray(d.plan.analyzers) ? (d.plan.analyzers as PlanEntry[]) : null
    return {
      ...initialState, seq: e.seq, job, status: job.status, plan, runs: runsOf(job), finalization: job.finalization,
      progress: isProgress(d.progress) ? d.progress : null,
      previews: isObj(d.previews) ? d.previews : {}, activities: isObj(d.activities) ? d.activities : {},
      scrapeActivity: s.scrapeActivity, terminal: terminalOf(job),
    }
  }
  if (e.seq <= s.seq) return s
  let n: State = { ...s, seq: e.seq }
  if (isProgress(d.progress)) n.progress = d.progress
  const run = isObj(d.analyzer) && typeof d.analyzer.id === 'string' ? (d.analyzer as AnalyzerRun) : null
  const job = s.job
  switch (e.type) {
    case 'job.started':
      return { ...n, status: job?.scrape ? 'scraping' : 'running' }
    case 'scrape.started':
    case 'scrape.succeeded':
    case 'scrape.failed':
      if (!job || !isObj(d.scrape)) return n
      n = { ...n, job: { ...job, scrape: d.scrape, ...(isObj(d.input) ? { input: d.input as Job['input'] } : {}) } }
      if (e.type === 'scrape.started' && isActivity(d.activity)) n.scrapeActivity = d.activity
      if (e.type === 'scrape.succeeded') n.status = 'running'
      return n
    case 'analysis.planned':
      if (!Array.isArray(d.analyzers)) return n
      return { ...n, plan: d.analyzers as PlanEntry[], progress: n.progress ?? { done: 0, running: [], total: typeof d.total === 'number' ? d.total : d.analyzers.length } }
    case 'analyzer.started':
    case 'analyzer.succeeded':
    case 'analyzer.failed':
    case 'analyzer.skipped':
      if (!run) return n
      n.runs = { ...s.runs, [run.id]: run }
      if (e.type === 'analyzer.started' && isActivity(d.activity)) n.activities = { ...s.activities, [run.id]: d.activity }
      if (e.type === 'analyzer.succeeded' && isObj(d.preview)) n.previews = { ...s.previews, [run.id]: d.preview }
      return n
    case 'analysis.ready_for_finalization':
      return { ...n, status: 'finalizing' }
    case 'analysis.finalizing':
    case 'analysis.finalized':
    case 'analysis.finalization_failed': {
      if (!isObj(d.finalization)) return n
      n.finalization = d.finalization as Finalization
      const fin = s.plan?.find((p) => p.activity_key === 'finalizer')
      if (e.type === 'analysis.finalizing') {
        n.status = 'finalizing'
        if (fin && isActivity(d.activity)) n.activities = { ...s.activities, [fin.id]: d.activity }
      }
      return n
    }
    case 'job.completed':
    case 'job.cancelled':
    case 'job.failed':
      if (!isObj(d.job)) return n
      return { ...n, job: d.job as Job, status: (d.job as Job).status, runs: runsOf(d.job as Job), finalization: (d.job as Job).finalization, terminal: terminalOf(d.job as Job) ?? (e.type === 'job.completed' ? 'completed' : e.type === 'job.cancelled' ? 'cancelled' : 'failed') }
    default:
      return n
  }
}

export type Tone = 'gray' | 'blue' | 'green' | 'orange'
export type Row = { id: string; title: string; detail: string | null; ms: number | null; tone: Tone; label: string }

// One-line summary of a preview, from counts the server computed (analysis-job-events, Result preview).
export function previewSummary(key: string, p: Record<string, unknown> | undefined): string | null {
  if (!p) return null
  const n = (v: unknown, one: string, many = `${one}s`) => (typeof v === 'number' ? `${v} ${v === 1 ? one : many}` : null)
  const parts =
    key === 'topic_extraction' ? [n(p.claims_total, 'claim'), n(p.topics_total, 'topic')]
    : key === 'news_search' ? [n(p.articles, 'article')]
    : key === 'fact_check' ? [n(p.fact_checks, 'fact check')]
    : key === 'techniques' ? [n(p.detected_total, 'technique detected', 'techniques detected')]
    : key === 'llm_techniques' ? [n(p.findings_total, 'finding')]
    : key === 'translation' ? [p.translated === false ? 'not translated' : typeof p.source_language === 'string' ? `translated from ${p.source_language}` : null]
    : key === 'propaganda_detection' ? [typeof p.label === 'string' ? p.label : null]
    : []
  const text = parts.filter(Boolean).join(' · ')
  return text || null
}

const TIMEOUT = 'timeout'
function pill(status: string, error: { code: string } | null): { tone: Tone; label: string } {
  switch (status) {
    case 'running': return { tone: 'blue', label: 'Running' }
    case 'succeeded':
    case 'completed': return { tone: 'green', label: 'Completed' }
    case 'failed': return { tone: 'orange', label: error?.code === TIMEOUT ? 'Timed out' : (error?.code ?? 'Failed') }
    case 'skipped': return { tone: 'gray', label: 'Skipped' }
    case 'pending': return { tone: 'gray', label: 'Pending' }
    default: return { tone: 'gray', label: status || 'Pending' }
  }
}

// Ledger rows: one per PlanEntry in plan order; the finalizer row follows `finalization`.
export function ledgerRows(s: State): Row[] {
  return (s.plan ?? []).map((p) => {
    const act = s.activities[p.id]
    const fin = p.activity_key === 'finalizer' ? s.finalization : null
    const run = fin ? null : s.runs[p.id]
    const status = fin ? fin.status : (run?.status ?? 'pending')
    const settled = ['succeeded', 'completed', 'failed', 'skipped'].includes(status)
    const note = fin ? (status === 'skipped' || status === 'failed' ? fin.reason : null) : ((run?.note as string | null | undefined) ?? (status === 'skipped' ? run?.reason : null) ?? null)
    const detail = (settled ? note || previewSummary(p.activity_key, s.previews[p.id]) : null) || act?.detail || null
    return {
      id: p.id, title: act?.text ?? p.name, detail, ms: (fin ?? run)?.duration_ms ?? null,
      ...pill(status, (fin ?? run)?.error ?? null),
    }
  })
}
