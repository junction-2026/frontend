// Types follow shared spec propaganda-map-api (tolerant reader): "at least these members"; unknown members are dropped by the readers.
// Every string comes from outlet data, scraped pages or user input: render it as plain text.

export type TechniqueCount = { name: string; display: string; analyses: number }
export type CountryAggregate = { country_code: string; country: string; analyses: number; techniques: TechniqueCount[] }
export type CountriesResponse = { items: CountryAggregate[]; analyses: number }

export type MapTechnique = { name: string; display: string; strength?: string } // no strength: old result, show no indicator
export type MapCountry = { country_code: string; country: string; basis: string[] } // basis: only the known 'outlet' | 'content' are kept
export type MapAnalysis = {
  job_id: string
  created_at: string
  country_code: string
  country: string
  countries: MapCountry[]
  outlet: { name: string; domain: string } | null
  source: { url: string; title: string | null }
  snippet: string
  techniques: MapTechnique[]
  verdict: string | null
}
export type MapAnalysesPage = { items: MapAnalysis[]; next_cursor: string | null }

const obj = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {})
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

export function readCountries(raw: unknown): CountriesResponse {
  const items = arr(obj(raw).items).map((i) => {
    const o = obj(i)
    const techniques = arr(o.techniques).map((t) => ({ name: str(obj(t).name), display: str(obj(t).display) || str(obj(t).name), analyses: count(obj(t).analyses) })).filter((t) => t.name)
    return { country_code: str(o.country_code).toUpperCase(), country: str(o.country), analyses: count(o.analyses), techniques }
  }).filter((c) => c.country_code && c.analyses >= 1)
  return { items, analyses: count(obj(raw).analyses) }
}

const BASES = ['outlet', 'content']
const readMapCountries = (v: unknown): MapCountry[] => arr(v).map((c) => {
  const o = obj(c)
  return { country_code: str(o.country_code).toUpperCase(), country: str(o.country), basis: arr(o.basis).filter((b): b is string => typeof b === 'string' && BASES.includes(b)) }
}).filter((c) => c.country_code)

export function readAnalyses(raw: unknown): MapAnalysesPage {
  const items = arr(obj(raw).items).map((i) => {
    const o = obj(i)
    const outlet = obj(o.outlet)
    const techniques = arr(o.techniques).map((t) => {
      const x = obj(t)
      return { name: str(x.name), display: str(x.display) || str(x.name), ...(typeof x.strength === 'string' ? { strength: x.strength } : {}) }
    }).filter((t) => t.name)
    return {
      job_id: str(o.job_id), created_at: str(o.created_at), country_code: str(o.country_code), country: str(o.country),
      countries: readMapCountries(o.countries),
      outlet: typeof outlet.name === 'string' ? { name: outlet.name, domain: str(outlet.domain) } : null,
      source: { url: str(obj(o.source).url), title: typeof obj(o.source).title === 'string' ? (obj(o.source).title as string) : null },
      snippet: str(o.snippet), techniques, verdict: typeof o.verdict === 'string' ? o.verdict : null,
    }
  }).filter((a) => a.job_id)
  const next = obj(raw).next_cursor
  return { items, next_cursor: typeof next === 'string' && next ? next : null }
}
