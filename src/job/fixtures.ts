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

// A RiskScore as in shared manipulation-risk-score (all three dimensions available, "All three dimensions" scenario).
const dim = (extra: Record<string, unknown> = {}) => ({ available: true, score: 0.8, weight: 0.3, contribution: 0.24, confidence: 'normal', reason: null, source: 'x', ...extra })
export const risk = (extra: Record<string, unknown> = {}) => ({
  version: 1, status: 'scored', reason: null, score: 0.6796, raw_score: 0.6796, band: 'high', dampened: false,
  summary: 'Server summary: high risk.',
  dimensions: {
    intensity: dim({ score: 0.424, weight: 0.4, contribution: 0.1696 }),
    confirmation: dim({ score: 0.8 }),
    amplification: dim({ score: 0.9, weight: 0.3, contribution: 0.27, basis: 'author', author_posts: 120 }),
  },
  techniques: [
    { label: 'Appeal_to_fear-prejudice', display: 'Appeal to fear', probability: 0.9, impact: 'high', weight: 1, contribution: 0.9 },
    { label: 'Loaded_Language', display: 'Loaded language', probability: 0.7, impact: 'high', weight: 1, contribution: 0.7 },
    { label: 'Doubt', display: 'Doubt', probability: 0.35, impact: 'lower', weight: 0.4, contribution: 0.14 },
  ],
  drivers: [
    { kind: 'amplification', dimension: 'amplification', technique: null, contribution: 0.27, text: 'Server driver A.' },
    { kind: 'propaganda_pattern', dimension: 'confirmation', technique: null, contribution: 0.24, text: 'Server driver B.' },
  ],
  caveats: [
    { id: 'content_not_reader', text: 'Server caveat 1.' },
    { id: 'bot_not_intent', text: 'Server caveat 2.' },
  ],
  config: {}, ...extra,
})
