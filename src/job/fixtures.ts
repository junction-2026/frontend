// Test builders for the analysis-jobs-api Job object (shared-specs analysis-jobs-api).
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

export const run = (id: string, status: string, extra: Record<string, unknown> = {}) => ({
  id, name: `${id} analyzer`, category: 'x', depends_on: [], status, reason: null, error: null,
  started_at: null, finished_at: null, duration_ms: null, result: null, availability: status === 'succeeded' ? 'ran' : null, note: null, ...extra,
})

export const coverage = (extra: Record<string, unknown> = {}) => ({
  total: 3, applicable: 2, pending: 0, running: 0, succeeded: 1, failed: 1, skipped: 1, settled: 3, ...extra,
})

export const assessment = (extra: Record<string, unknown> = {}) => ({
  verdict: 'detected', confidence: 0.86, user_text: 'This text pressures the reader.', produced_by: 'finalizer', usage: null, attempts: 1, retry_reason: null, ...extra,
})

export const finalization = (status: string, extra: Record<string, unknown> = {}) => ({
  status, analyzer_id: 'llm', reason: null, error: null, started_at: null, finished_at: null, duration_ms: null, result: null, ...extra,
})

export const job = (extra: Record<string, unknown> = {}) => ({
  id: 'j1', status: 'completed', done: true,
  created_at: '2026-11-14T10:00:00Z', started_at: '2026-11-14T10:00:00Z', finished_at: '2026-11-14T10:00:03.200Z',
  input: { content: 'Everyone knows these people are destroying our future.' }, scrape: null, options: { finalize: true },
  analyzers: [], coverage: coverage(), finalization: finalization('completed', { result: assessment() }), ...extra,
})
