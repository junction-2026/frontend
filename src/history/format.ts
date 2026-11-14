import { formatDate, formatRelativeTime, type Locale } from '../i18n'

type Translate = (key: string) => string

const DAY = 86_400_000
const dayStart = (t: number) => new Date(new Date(t).setHours(0, 0, 0, 0)).getTime()

// "Today", "Yesterday" or the local date, by calendar day (not by 24 h windows).
export function dayLabel(iso: string, now: number, locale: Locale, t: Translate): string {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return t('history.day.unknown')
  const diff = Math.round((dayStart(now) - dayStart(ms)) / DAY)
  if (diff === 0) return t('history.day.today')
  if (diff === 1) return t('history.day.yesterday')
  return formatDate(ms, { year: 'numeric', month: 'short', day: 'numeric' }, locale)
}

export function relativeTime(iso: string, now: number, locale: Locale, t: Translate): string {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return ''
  return now - ms < 60_000 ? t('history.just_now') : formatRelativeTime(ms, now, locale) // a future time reads as "just now" too
}

export const EXCERPT_LEN = 140
export const excerpt = (s: string) => (s.length > EXCERPT_LEN ? `${s.slice(0, EXCERPT_LEN)}…` : s)
