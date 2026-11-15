import { activeLocale } from './translate'
import type { Locale } from './locales'

type DateInput = Date | string | number
const asDate = (v: DateInput) => (v instanceof Date ? v : new Date(v))

export const formatDate = (value: DateInput, options?: Intl.DateTimeFormatOptions, locale: Locale = activeLocale()) =>
  new Intl.DateTimeFormat(locale, options).format(asDate(value))

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions, locale: Locale = activeLocale()) =>
  new Intl.NumberFormat(locale, options).format(value)

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]]

// "3 hours ago" / "in 2 days": the largest unit that fits the distance between iso and now.
export function formatRelativeTime(iso: DateInput, now: DateInput = Date.now(), locale: Locale = activeLocale()): string {
  const seconds = Math.round((asDate(iso).getTime() - asDate(now).getTime()) / 1000)
  const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? (['second', 1] as const)
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(Math.round(seconds / size), unit)
}

// A 0..1 ratio as a whole percent (fr: "86 %" with a non-breaking space; ar: Arabic percent sign).
export const formatPercent = (ratio: number, options?: Intl.NumberFormatOptions, locale: Locale = activeLocale()) =>
  formatNumber(ratio, { style: 'percent', ...options }, locale)

export { pluralCategory } from './translate'

const displayNames = new Map<string, Intl.DisplayNames>()
// The locale's own name of an ISO 3166-1 alpha-2 country; without one (no ICU data, unknown code) the given fallback.
// The locale's own name of an ISO 639-1 language; null when it has none (no ICU data, unknown code).
export function formatLanguageName(code: string, locale: string = activeLocale()): string | null {
  try {
    const n = new Intl.DisplayNames(locale, { type: 'language', fallback: 'none' }).of(code)
    if (n && n.toLowerCase() !== code.toLowerCase()) return n
  } catch {
    /* Intl.DisplayNames missing or invalid code */
  }
  return null
}

export function formatCountryName(code: string, fallback: string, locale: string = activeLocale()): string {
  try {
    let dn = displayNames.get(locale)
    if (!dn) displayNames.set(locale, (dn = new Intl.DisplayNames(locale, { type: 'region' })))
    const n = dn.of(code)
    if (n && n !== code) return n
  } catch {
    /* Intl.DisplayNames missing or invalid code */
  }
  return fallback
}
