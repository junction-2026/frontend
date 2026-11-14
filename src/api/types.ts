// Types follow shared specs api-conventions / analysis-jobs-api / analysis-job-events (tolerant reader):
// every object is "at least these members", so each carries an index signature and unknown members are ignored.

export type Timestamp = string // RFC 3339, UTC

export type Verdict = 'detected' | 'not_detected' | 'uncertain'
// Unknown or missing verdicts are shown as uncertain (analysis-jobs-api, Verdict values).
export const verdictOf = (v: unknown): Verdict => (v === 'detected' || v === 'not_detected' ? v : 'uncertain')

export type Input = {
  content: string
  content_type?: string
  source?: { url?: string; title?: string; author?: string; platform?: string; published_at?: Timestamp; metadata?: Record<string, unknown> }
  [k: string]: unknown
}

export type AnalyzerRun = {
  id: string
  name: string
  category: string
  depends_on: string[]
  status: string // pending | running | succeeded | failed | skipped | (unknown)
  reason: string | null
  error: { code: string; message: string } | null
  started_at: Timestamp | null
  finished_at: Timestamp | null
  duration_ms: number | null
  result: unknown
  [k: string]: unknown
}

export type Coverage = {
  total: number; applicable: number; pending: number; running: number
  succeeded: number; failed: number; skipped: number; settled: number
  [k: string]: unknown
}

export type FinalAssessment = {
  verdict: string // read with verdictOf
  confidence: number | null
  user_text: string // untrusted: render as plain text
  produced_by: string
  [k: string]: unknown
}

export type Finalization = {
  status: string // pending | running | completed | failed | skipped | (unknown)
  analyzer_id: string | null
  reason: string | null
  error: { code: string; message: string } | null
  started_at: Timestamp | null
  finished_at: Timestamp | null
  duration_ms: number | null
  result: FinalAssessment | null
  [k: string]: unknown
}

// Manipulation risk score (shared manipulation-risk-score). Read tolerantly (src/job/risk.ts): unknown status, band, reason,
// kind and caveat ids are expected, and every text member is untrusted plain text.
export type RiskDimension = {
  available: boolean; score: number | null; confidence: string | null; reason: string | null; basis?: string | null
  [k: string]: unknown
}
export type RiskTechnique = { label: string; display: string; probability: number; impact: string; [k: string]: unknown }
export type RiskDriver = { kind: string; dimension: string | null; technique: string | null; contribution: number; text: string; [k: string]: unknown }
export type RiskCaveat = { id: string; text: string; [k: string]: unknown }
export type RiskScore = {
  version: number
  status: string // scored | unavailable | (unknown)
  reason: string | null
  score: number | null; raw_score: number | null
  band: string | null // low | moderate | high | critical | (unknown)
  dampened: boolean
  summary: string
  dimensions: { intensity: RiskDimension; confirmation: RiskDimension; amplification: RiskDimension; [k: string]: unknown }
  techniques: RiskTechnique[]
  drivers: RiskDriver[]
  caveats: RiskCaveat[]
  config: Record<string, unknown>
  [k: string]: unknown
}

export type Job = {
  id: string
  status: string // queued | scraping | running | finalizing | completed | cancelled | failed | (unknown)
  done: boolean
  created_at: Timestamp
  started_at: Timestamp | null
  finished_at: Timestamp | null
  input: Input | null
  scrape: Record<string, unknown> | null
  options: { finalize?: boolean; [k: string]: unknown }
  public?: boolean // absent means public
  analyzers: AnalyzerRun[]
  coverage: Coverage
  finalization: Finalization
  risk?: RiskScore | null // missing reads like null
  [k: string]: unknown
}

// An unknown status is judged by `done` (api-conventions, Tolerant reader for enumerations).
export const isDone = (job: Pick<Job, 'done'>): boolean => job.done === true

export type JobSummary = {
  id: string
  status: string
  done: boolean
  created_at: Timestamp
  finished_at: Timestamp | null
  coverage: Coverage
  finalization: { status: string; verdict: string | null; [k: string]: unknown }
  [k: string]: unknown
}

export type AnalyzerInfo = {
  id: string; name: string; category: string; enabled: boolean
  depends_on: string[]; trigger: string; selectable: boolean
  [k: string]: unknown
}

// GET /jobs/{id}/localization (shared job-text-localization). `status` is read tolerantly: anything but original/translated is unavailable.
export type LocalizedText = { status: string; text: string | null; source_language: string | null; [k: string]: unknown }
export type JobLocalization = {
  job_id: string
  language: string
  final_assessment: { user_text: LocalizedText; [k: string]: unknown } | null
  llm_findings: { index: number; label: string; explanation: LocalizedText; [k: string]: unknown }[]
  [k: string]: unknown
}

// Result of the `wikipedia` analyzer (shared wikipedia-lookup-result, incl. change wikipedia-cross-language). Every member
// is read tolerantly: unknown `status`, `coverage` and `cross_language` values and absent members must not break rendering.
export type WikiLookup = {
  language: string; query: string; status: string; cached: boolean
  title: string | null; url: string | null; passage: string | null
  coverage?: string | null; evidence_sentence?: string | null
  [k: string]: unknown
}
// `text` is the verbatim substring of that wiki's passage, `value` the normalized value; both untrusted.
export type CompareValue = { kind: string; value: string; text: string; [k: string]: unknown }
export type CrossLanguageDifference = { language: string; url: string | null; values: CompareValue[]; [k: string]: unknown }
export type ClaimLookup = {
  claim: string; check_worthiness: number; search_mode: string; wikis: WikiLookup[]
  cross_language?: string | null // agree | discrepancy | gap | null; missing or unknown reads as null
  cross_language_differences?: CrossLanguageDifference[] | null
  [k: string]: unknown
}
export type WikipediaLookup = { languages: string[]; claims: ClaimLookup[]; requests_used: number; cached: number; [k: string]: unknown }

// POST /jobs/{id}/chat (shared analysis-chat-api). A reply's `content` is untrusted model output: render as plain text only.
export type ChatMessage = { role: 'user' | 'assistant'; content: string }
export type ChatRequest = { messages: ChatMessage[]; language?: string }
export type ChatReply = { job_id: string; message: ChatMessage; history_truncated: boolean; created_at: Timestamp; [k: string]: unknown }

export type CreateJobBody =
  | { input: Input; analyzers?: string[]; options?: { finalize?: boolean }; public?: boolean }
  | { scrape: { url: string; max_posts?: number; max_comments?: number }; analyzers?: string[]; options?: { finalize?: boolean }; public?: boolean }

export type Page<T> = { items: T[]; next_cursor: string | null }

export type ApiError = { status: number; code: string; message: string; details?: Record<string, unknown> }
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }

// WebSocket event envelope; `type` may be any string, unknown ones are ignored by the client.
export type JobEvent = { type: string; job_id: string; seq: number; emitted_at: Timestamp; data: Record<string, unknown>; [k: string]: unknown }
