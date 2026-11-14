import { describe, expect, it } from 'vitest'
import { translate, type Locale } from '../i18n'
import { dayLabel, relativeTime } from './format'

const NOW = new Date(2026, 10, 14, 12, 0, 0).getTime() // local noon
const iso = (ms: number) => new Date(ms).toISOString()
const H = 3_600_000
const t = (l: Locale) => (key: string) => translate(l, key)

describe('dayLabel', () => {
  it.each([
    ['en', 'Today', 'Yesterday', 'Unknown date'],
    ['de', 'Heute', 'Gestern', 'Unbekanntes Datum'],
    ['fi', 'Tänään', 'Eilen', 'Tuntematon päivämäärä'],
  ] as const)('translates today, yesterday and unknown in %s', (l, today, yesterday, unknown) => {
    expect(dayLabel(iso(NOW - H), NOW, l, t(l))).toBe(today)
    expect(dayLabel(iso(NOW - 24 * H), NOW, l, t(l))).toBe(yesterday)
    expect(dayLabel('nope', NOW, l, t(l))).toBe(unknown)
  })

  it('formats older days with the locale (year numeric, month short, day numeric)', () => {
    const old = iso(NOW - 5 * 24 * H)
    expect(dayLabel(old, NOW, 'en', t('en'))).toBe('Nov 9, 2026')
    expect(dayLabel(old, NOW, 'de', t('de'))).toBe('9. Nov. 2026')
    // the exact Finnish short form depends on the ICU build, so compare with Intl itself
    expect(dayLabel(old, NOW, 'fi', t('fi'))).toBe(new Intl.DateTimeFormat('fi', { year: 'numeric', month: 'short', day: 'numeric' }).format(NOW - 5 * 24 * H))
    expect(dayLabel(old, NOW, 'fi', t('fi'))).not.toBe('Nov 9, 2026')
  })
})

describe('relativeTime', () => {
  it('uses the catalog text under a minute, also for a future time', () => {
    expect(relativeTime(iso(NOW - 30_000), NOW, 'de', t('de'))).toBe('gerade eben')
    expect(relativeTime(iso(NOW + 5 * H), NOW, 'fi', t('fi'))).toBe('juuri nyt')
    expect(relativeTime(iso(NOW - 30_000), NOW, 'en', t('en'))).toBe('just now')
  })

  it('uses Intl.RelativeTimeFormat for the locale', () => {
    expect(relativeTime(iso(NOW - H), NOW, 'en', t('en'))).toBe('1 hour ago')
    expect(relativeTime(iso(NOW - 3 * H), NOW, 'de', t('de'))).toBe('vor 3 Stunden')
    expect(relativeTime(iso(NOW - 3 * H), NOW, 'fi', t('fi'))).toBe('3 tuntia sitten')
    expect(relativeTime(iso(NOW - 2 * 24 * H), NOW, 'de', t('de'))).toBe('vorgestern')
  })

  it('is empty for an invalid date', () => {
    expect(relativeTime('nope', NOW, 'en', t('en'))).toBe('')
  })
})
