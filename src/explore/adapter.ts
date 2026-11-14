import type { Job } from '../api/types'
import type { ExploreData, ExploreItem, ExploreQuery, RunState } from './model'

type Obj = Record<string, unknown>
const obj = (v: unknown): Obj | null => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Obj) : null)
const str = (v: unknown) => (typeof v === 'string' && v !== '' ? v : null)

const KNOWN = ['pending', 'running', 'succeeded', 'failed', 'skipped']

function state(job: Job, id: string): { run: RunState; result: Obj | null } {
  const r = obj(Array.isArray(job.analyzers) ? job.analyzers.find((a) => obj(a)?.id === id) : undefined)
  if (!r) return { run: { status: 'missing', reason: null, error: null }, result: null }
  // An unknown status is judged by the job: still running means pending, finished means not run.
  const status = (KNOWN.includes(r.status as string) ? r.status : job.done === true ? 'skipped' : 'pending') as RunState['status']
  return { run: { status, reason: str(r.reason), error: str(obj(r.error)?.code) }, result: obj(r.result) }
}

// Canonical form used as the item id and for dedupe; null unless an http/https URL.
export function canonicalUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return null
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  const host = u.host.replace(/^www\./, '')
  return `${u.protocol}//${host}${u.pathname.length > 1 ? u.pathname.replace(/\/$/, '') : u.pathname}${u.search}`
}

const hostOf = (url: string) => new URL(url).host.replace(/^www\./, '')
const code = (v: unknown) => (typeof v === 'string' && /^[A-Z]{2}$/.test(v) ? v : null)

function readQueries(res: Obj | null): ExploreQuery[] {
  if (!Array.isArray(res?.queries)) return []
  return res.queries.flatMap((v: unknown): ExploreQuery[] => {
    const o = obj(v)
    const q = str(o?.q)
    const original = str(o?.original)
    return o && q && original ? [{ q, original, origin: str(o.origin), language: str(o.language) }] : []
  })
}

const dedupe = (items: ExploreItem[]) => {
  const seen = new Set<string>()
  return items.filter((i) => !seen.has(i.id) && !!seen.add(i.id))
}

// Tolerant reader of news_search / source_info / fact_check; never throws, drops invalid entries.
export function readExplore(job: Job): ExploreData {
  const news = state(job, 'news_search')
  const geo = state(job, 'source_info')
  const fact = state(job, 'fact_check')
  const rawArticles = news.run.status === 'succeeded' && Array.isArray(news.result?.articles) ? (news.result.articles as unknown[]) : null
  if (news.run.status === 'succeeded' && !rawArticles) news.run = { status: 'failed', reason: null, error: 'unreadable_result' }
  const queries = readQueries(news.result)
  const topicOf = (q: string | null, lang: string | null) =>
    (queries.find((x) => x.q === q && x.language === lang) ?? queries.find((x) => x.q === q))?.original ?? null

  const sourceArticles = geo.run.status === 'succeeded' && Array.isArray(geo.result?.articles) ? (geo.result.articles as unknown[]) : null
  if (geo.run.status === 'succeeded' && !sourceArticles) geo.run = { status: 'failed', reason: null, error: 'unreadable_result' }

  const articles = (rawArticles ?? []).flatMap((v, index): ExploreItem[] => {
    const a = obj(v)
    const title = str(a?.title)
    const id = canonicalUrl(a?.url)
    if (!a || !title || !id) return []
    const url = a.url as string
    const sa = obj(sourceArticles?.[index])
    // Joined by index and verified by equal url; never inferred from language, TLD or text.
    const outlet = sa && sa.matched === true && sa.url === url ? obj(sa.outlet) : null
    const cc = code(outlet?.country_code)
    const domain = str(a.domain) ?? hostOf(url)
    const query = str(a.query)
    const language = str(a.language)
    return [{
      id, kind: 'article', title, url, domain,
      publisher: str(outlet?.name) ?? str(a.source) ?? domain,
      date: str(a.date), language, snippet: str(a.snippet), query, origin: str(a.origin),
      countryCode: cc, countryName: cc ? str(outlet?.country) : null,
      outletName: str(outlet?.name), outletDomain: outlet ? str(outlet.domain) : null,
      topic: topicOf(query, language), rating: null, forClaim: null, checkedClaim: null,
    }]
  })

  const rawChecks = fact.run.status === 'succeeded' && Array.isArray(fact.result?.fact_checks) ? (fact.result.fact_checks as unknown[]) : null
  if (fact.run.status === 'succeeded' && !rawChecks) fact.run = { status: 'failed', reason: null, error: 'unreadable_result' }
  const checks = (rawChecks ?? []).flatMap((v): ExploreItem[] => {
    const f = obj(v)
    const id = canonicalUrl(f?.url)
    if (!f || !id) return []
    const url = f.url as string
    return [{
      id, kind: 'fact_check', title: str(f.title) ?? str(f.claim) ?? url, url,
      domain: str(f.site) ?? hostOf(url), publisher: str(f.publisher) ?? str(f.site),
      date: str(f.review_date), language: str(f.language), snippet: null, query: null, origin: null,
      countryCode: null, countryName: null, outletName: null, outletDomain: null, topic: null,
      rating: str(f.rating), forClaim: str(f.for_claim), checkedClaim: str(f.claim),
    }]
  })

  const items = [...dedupe(articles), ...dedupe(checks)]
  return {
    newsStatus: news.run, geoStatus: geo.run, factStatus: fact.run, queries, items,
    unknownCountry: items.filter((i) => i.kind === 'article' && !i.countryCode).length,
  }
}
