import { bundledName, type Coverage, type Level } from '../secondary/worldMapData'
import { publisherKey, type ExploreItem, type ExploreQuery } from './model'

// The single pipeline: map, tooltip, panel, list, counts and subtitle all derive from this output —
// every item (articles and fact-checks), narrowed only by the country picked on the map.
export const filterItems = (items: ExploreItem[], country: string | null): ExploreItem[] =>
  country ? items.filter((i) => i.countryCode === country) : items

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
