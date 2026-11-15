// A completed job with one result element of every focus kind (test fixture).
import type { Job } from '../api/types'
import { job as baseJob, risk, run } from '../job/fixtures'

export const richJob = (extra: Record<string, unknown> = {}) =>
  baseJob({
    analyzers: [
      run('techniques', 'succeeded', {
        result: {
          detected: [
            { name: 'Loaded_Language', display: 'Loaded language', explanation: 'x', spans: [{ technique: 'Loaded_Language', text: 'Everyone knows', start: 0, end: 14 }, { technique: 'Loaded_Language', text: 'destroying', start: 32, end: 42 }] },
            { name: 'Doubt', display: 'Doubt', explanation: 'x', spans: [] },
          ],
          span_status: 'ok',
        },
      }),
      run('llm_techniques', 'succeeded', {
        result: { findings: [{ label: 'misleading_headline', name: 'Misleading headline', definition: 'd', explanation: 'e', span: { field: 'content', text: 'Everyone knows', start: 0, end: 14 } }] },
      }),
      run('wikipedia', 'succeeded', { result: { languages: ['en'], claims: [{ claim: 'People are destroying our future', check_worthiness: 0.9, search_mode: 'x', wikis: [] }], requests_used: 1, cached: 0 } }),
      run('term_context', 'succeeded', { result: { terms: [{ term: 'future', in_post: 'our future' }] } }),
    ],
    risk: risk(),
    ...extra,
  }) as unknown as Job

