const DAY = 86_400_000
const dayStart = (t: number) => new Date(new Date(t).setHours(0, 0, 0, 0)).getTime()

// "Today", "Yesterday" or the local date, by calendar day (not by 24 h windows).
export function dayLabel(iso: string, now = Date.now()): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return 'Unknown date'
  const diff = Math.round((dayStart(now) - dayStart(t)) / DAY)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function relativeTime(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000))
  if (Number.isNaN(s)) return ''
  const unit = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'} ago`
  if (s < 60) return 'just now'
  if (s < 3600) return unit(Math.floor(s / 60), 'min')
  if (s < 86400) return unit(Math.floor(s / 3600), 'hour')
  return unit(Math.floor(s / 86400), 'day')
}

export const EXCERPT_LEN = 140
export const excerpt = (s: string) => (s.length > EXCERPT_LEN ? `${s.slice(0, EXCERPT_LEN)}…` : s)
