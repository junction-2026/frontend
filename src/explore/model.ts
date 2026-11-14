// Normalized Explore model: one item per distinct article (news_search) or fact-check (fact_check).
export type ExploreItem = {
  id: string // canonical URL
  kind: 'article' | 'fact_check'
  title: string
  url: string // http/https, as sent by the backend
  domain: string | null
  publisher: string | null
  date: string | null // provider text, shown verbatim
  language: string | null
  snippet: string | null
  query: string | null // q of the SearchQuery that found the article
  origin: string | null
  countryCode: string | null // verified Outlet.country_code only
  countryName: string | null
  outletName: string | null
  outletDomain: string | null
  topic: string | null // SearchQuery `original` the article was found by
  rating: string | null // fact-check only
  forClaim: string | null // fact-check only
}

export type RunState = {
  status: 'missing' | 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped'
  reason: string | null
  error: string | null // error code
}

export type ExploreQuery = { q: string; original: string; origin: string | null; language: string | null }

export type ExploreData = {
  newsStatus: RunState
  geoStatus: RunState
  factStatus: RunState
  queries: ExploreQuery[]
  items: ExploreItem[]
  unknownCountry: number // articles without a verified country
}

export type Filters = {
  topic: string | null
  text: string
  languages: string[]
  publishers: string[]
  country: string | null
  verifiedOnly: boolean
}

export const NO_FILTERS: Filters = { topic: null, text: '', languages: [], publishers: [], country: null, verifiedOnly: false }

// Distinct publishers are counted by Outlet domain for matched items, else by Article domain.
export const publisherKey = (i: ExploreItem) => i.outletDomain ?? i.domain ?? i.publisher ?? i.id
