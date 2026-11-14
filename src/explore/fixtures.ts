// Test builders for the news_search / source_info / fact_check results (shared-specs news-search-result, source-info-result, fact-check-result).
import { job, run } from '../job/fixtures'

export const article = (n: number | string, extra: Record<string, unknown> = {}) => ({
  title: `Headline ${n}`, url: `https://site${n}.example/a${n}`, domain: `site${n}.example`, source: null, date: null,
  snippet: null, language: 'en', query: 'q one', origin: 'topic', ...extra,
})
export const outlet = (extra: Record<string, unknown> = {}) => ({
  name: 'Outlet', domain: 'outlet.example', country_code: 'FI', country: 'Finland', bias: 'center', factuality: 'high', ...extra,
})
export const sourceArticle = (a: { url: string }, o?: Record<string, unknown>) =>
  o ? { url: a.url, domain: 'x', matched: true, match: 'host', outlet: outlet(o) } : { url: a.url, domain: 'x', matched: false }
export const query = (q: string, original: string, extra: Record<string, unknown> = {}) => ({
  q, original, origin: 'topic', language: 'en', endpoint: 'news', status: 'succeeded', results: 1, cached: false, error: null, ...extra,
})
export const factCheck = (extra: Record<string, unknown> = {}) => ({
  for_claim: 'Claim text', query: 'q', url: 'https://fc.example/check', claim: 'Claim', claimant: null, claim_date: null,
  publisher: 'Fact Org', site: 'fc.example', title: 'Check title', rating: 'False', rating_normalized: 'false', language: 'en', review_date: '2026-01-02', ...extra,
})

type Opts = { articles?: unknown[]; queries?: unknown[]; sources?: unknown[]; checks?: unknown[]; extra?: Record<string, unknown>; runs?: unknown[] }
// A job whose analyzers are exactly the ones given (default: succeeded news_search, source_info and fact_check).
export const exploreJob = ({ articles = [], queries = [query('q one', 'Topic one')], sources, checks, extra, runs }: Opts = {}) =>
  job({
    analyzers: runs ?? [
      run('news_search', 'succeeded', { result: { languages: ['en'], queries, articles, searches_used: 1, cached: 0 } }),
      ...(sources ? [run('source_info', 'succeeded', { result: { articles: sources, page_outlet: null, summary: {}, table: {} } })] : []),
      ...(checks ? [run('fact_check', 'succeeded', { result: { queries: [], fact_checks: checks, requests_used: 1, cached: 0 } })] : []),
    ],
    ...extra,
  })
