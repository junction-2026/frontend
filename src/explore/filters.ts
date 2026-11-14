import { bundledName, type Coverage, type Level } from '../secondary/worldMapData'
import { publisherKey, type ExploreItem, type ExploreQuery, type Filters } from './model'

// The single filter pipeline: map, tooltip, panel, list, counts and subtitle all derive from this output.
// Fact-checks are shown only with `verifiedOnly`, articles only without it; the topic select does not apply to
// fact-checks (they are not found by a search query).
export function filterItems(items: ExploreItem[], f: Filters): ExploreItem[] {
  const text = f.text.trim().toLowerCase()
  return items.filter((i) => {
    if ((i.kind === 'fact_check') !== f.verifiedOnly) return false
    if (f.topic && i.kind === 'article' && i.topic !== f.topic) return false
    if (text && ![i.title, i.snippet, i.forClaim].some((s) => s?.toLowerCase().includes(text))) return false
    if (f.languages.length && !(i.language && f.languages.includes(i.language))) return false
    if (f.publishers.length && !f.publishers.includes(publisherKey(i))) return false
    if (f.country && i.countryCode !== f.country) return false
    return true
  })
}

const LEVELS = (n: number, max: number): Level => (n > (max * 2) / 3 ? 'high' : n > max / 3 ? 'medium' : 'low')

// Per verified country: counts of the items given; no entry for a country without items.
export function aggregateByCountry(items: ExploreItem[]): Coverage {
  const by = new Map<string, ExploreItem[]>()
  for (const i of items) if (i.countryCode) by.set(i.countryCode, [...(by.get(i.countryCode) ?? []), i])
  const max = Math.max(0, ...[...by.values()].map((v) => v.length))
  return Object.fromEntries(
    [...by].map(([code, v]) => [code, {
      name: v.find((i) => i.countryName)?.countryName ?? bundledName(code) ?? code,
      articles: v.length,
      publishers: new Set(v.map(publisherKey)).size,
      languages: [...new Set(v.flatMap((i) => (i.language ? [i.language] : [])))].sort(),
      level: LEVELS(v.length, max),
    }]),
  )
}

export const publisherCount = (items: ExploreItem[]) => new Set(items.map(publisherKey)).size

// Distinct searched topics, origin "topic" first.
export function topicsOf(queries: ExploreQuery[]): string[] {
  const order = [...queries].sort((a, b) => Number(b.origin === 'topic') - Number(a.origin === 'topic'))
  return [...new Set(order.map((q) => q.original))]
}

// Values present in the items with their counts (language code, or publisher key with its display name).
export function options(items: ExploreItem[], by: 'language' | 'publisher'): { value: string; label: string; count: number }[] {
  const m = new Map<string, { value: string; label: string; count: number }>()
  for (const i of items) {
    const value = by === 'language' ? i.language : publisherKey(i)
    if (!value) continue
    const o = m.get(value) ?? { value, label: by === 'language' ? value.toUpperCase() : (i.publisher ?? value), count: 0 }
    o.count++
    m.set(value, o)
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}
