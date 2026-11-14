import { readAnalyses, readCountries, type CountriesResponse, type MapAnalysesPage } from './mapTypes'
import type { AnalyzerInfo, ApiResult, ChatReply, ChatRequest, CreateJobBody, Job, JobLocalization, JobSummary, Page } from './types'

const BASE = '/api/v1'

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

// Never throws: every failure becomes { ok: false, error }.
async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  let response: Response
  try {
    response = await fetch(BASE + path, { ...init, headers: { Accept: 'application/json', ...init.headers } })
  } catch (e) {
    return { ok: false, error: { status: 0, code: 'network_error', message: e instanceof Error ? e.message : String(e) } }
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }
  if (response.ok) {
    if (body === undefined) return { ok: false, error: { status: response.status, code: 'invalid_response', message: 'The response was not valid JSON' } }
    return { ok: true, data: body as T }
  }
  const err = isObject(body) ? body.error : undefined
  if (isObject(err) && typeof err.code === 'string' && typeof err.message === 'string')
    return { ok: false, error: { status: response.status, code: err.code, message: err.message, ...(isObject(err.details) ? { details: err.details } : {}) } }
  return { ok: false, error: { status: response.status, code: `http_${response.status}`, message: `HTTP ${response.status} ${response.statusText}`.trim() } }
}

const id = encodeURIComponent

export const createJob = (body: CreateJobBody) =>
  request<Job>('/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export function listJobs({ limit, cursor, status }: { limit?: number; cursor?: string; status?: string } = {}) {
  const q = new URLSearchParams()
  if (limit !== undefined) q.set('limit', String(limit))
  if (cursor) q.set('cursor', cursor)
  if (status) q.set('status', status)
  const qs = q.toString()
  return request<Page<JobSummary>>(`/jobs${qs ? `?${qs}` : ''}`)
}

export const getJob = (jobId: string) => request<Job>(`/jobs/${id(jobId)}`)
export const cancelJob = (jobId: string) => request<Job>(`/jobs/${id(jobId)}/cancel`, { method: 'POST' })
export const listAnalyzers = () => request<{ items: AnalyzerInfo[] }>('/analyzers')
export const getJobLocalization = (jobId: string, language: string) =>
  request<JobLocalization>(`/jobs/${id(jobId)}/localization?language=${encodeURIComponent(language)}`)

// The server answers within 100 s (analysis-chat-api, Chat timeouts); clients wait at least 120 s.
export const CHAT_TIMEOUT_MS = 125_000

// A client-side timeout is reported as code `timeout`, not as a generic network error.
export async function postJobChat(jobId: string, body: ChatRequest, timeoutMs = CHAT_TIMEOUT_MS): Promise<ApiResult<ChatReply>> {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  try {
    const result = await request<ChatReply>(`/jobs/${id(jobId)}/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal,
    })
    return timedOut && !result.ok ? { ok: false, error: { status: 0, code: 'timeout', message: 'The request timed out' } } : result
  } finally {
    clearTimeout(timer)
  }
}

// Propaganda map (shared spec propaganda-map-api).
async function readMap<T>(path: string, read: (raw: unknown) => T): Promise<ApiResult<T>> {
  const r = await request<unknown>(path)
  return r.ok ? { ok: true, data: read(r.data) } : r
}
export const getMapCountries = () => readMap<CountriesResponse>('/map/countries', readCountries)

export function listCountryAnalyses(code: string, { cursor, limit }: { cursor?: string | null; limit?: number } = {}) {
  const q = new URLSearchParams()
  if (limit !== undefined) q.set('limit', String(limit))
  if (cursor) q.set('cursor', cursor)
  const qs = q.toString()
  return readMap<MapAnalysesPage>(`/map/countries/${id(code)}/analyses${qs ? `?${qs}` : ''}`, readAnalyses)
}
