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
