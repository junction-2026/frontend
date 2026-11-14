import { geoEqualEarth, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import topology from '../assets/countries-110m.json'
import { ALPHA2_BY_NUMERIC } from './countryCodes'

export type Level = 'low' | 'medium' | 'high'
/** Keyed by upper-case ISO 3166-1 alpha-2. */
export type Coverage = Record<string, { name?: string; articles: number; publishers: number; languages?: string[]; level: Level }>
export type Country = { code: string | null; name: string; d: string }

export const WIDTH = 960
const sphere = { type: 'Sphere' } as const
const projection = geoEqualEarth().fitWidth(WIDTH, sphere) // fills the viewBox edge to edge
const toPath = geoPath(projection)
export const HEIGHT = Math.ceil(toPath.bounds(sphere)[1][1])

const topo = topology as unknown as Topology
export const COUNTRIES: Country[] = feature(topo, topo.objects.countries as GeometryCollection<{ name: string }>)
  .features.flatMap((f) => {
    const d = toPath(f)
    return d ? [{ code: ALPHA2_BY_NUMERIC[String(f.id)] ?? null, name: f.properties.name, d }] : []
  })

const NAMES = new Map(COUNTRIES.flatMap((c) => (c.code ? [[c.code, c.name] as const] : [])))
/** Every interactive country, for the Country select. */
export const SELECTABLE = [...NAMES].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name))
export const bundledName = (code: string) => NAMES.get(code)
const displayNames = new Map<string, Intl.DisplayNames>()
// The locale's own name of the country; without one (unknown code, no ICU data) the English name that came with the data.
export function countryName(code: string, coverage: Coverage, locale = 'en'): string {
  try {
    let dn = displayNames.get(locale)
    if (!dn) displayNames.set(locale, (dn = new Intl.DisplayNames(locale, { type: 'region' })))
    const n = dn.of(code)
    if (n && n !== code) return n
  } catch {
    /* Intl.DisplayNames missing or invalid code */
  }
  return coverage[code]?.name ?? NAMES.get(code) ?? code
}
