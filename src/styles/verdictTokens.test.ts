import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/tokens.css', 'utf8')
const token = (name: string) => new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(css)?.[1] ?? ''
const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const VALUES: Record<string, Record<string, string>> = {
  detected: { bg: '#fde8e8', border: '#f5b8b8', heading: '#8b2525', text: '#8b2525', 'pill-bg': '#fde8e8', 'pill-text': '#8b2525' },
  'not-detected': { bg: '#e5f7ec', border: '#a8e4bf', heading: '#246b45', text: '#246b45', 'pill-bg': '#e5f7ec', 'pill-text': '#246b45' },
  uncertain: { bg: '#fff1dc', border: '#f2d49b', heading: '#8a5a18', text: '#8a5a18', 'pill-bg': '#fff1dc', 'pill-text': '#8a5a18' },
}

describe('verdict tokens', () => {
  it.each(Object.keys(VALUES))('%s: exact values; heading, text and pill text reach 4.5:1 on bg and pill-bg', (state) => {
    const t = (n: string) => token(`verdict-${state}-${n}`)
    for (const [n, hex] of Object.entries(VALUES[state])) expect(t(n).toLowerCase(), n).toBe(hex)
    for (const n of ['heading', 'text', 'pill-text']) {
      expect(contrast(t(n), t('bg')), `${n} on bg`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(t(n), t('pill-bg')), `${n} on pill-bg`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('uses a 30px verdict radius', () => expect(css).toMatch(/--radius-verdict:\s*30px/))
  it('defines --fw-extrabold as 800', () => expect(css).toMatch(/--fw-extrabold:\s*800\b/))
})

describe('verdict card CSS', () => {
  const results = readFileSync('src/job/results.css', 'utf8')
  const card = results.slice(results.indexOf('/* Verdict card (Results)'))
  it('uses logical properties only, so right-to-left mirrors the card', () => {
    expect(card).not.toMatch(/(margin|padding|border)-(left|right)|(^|[\s{;])(left|right)\s*:|text-align:\s*(left|right)/m)
    expect(card).toMatch(/text-align:\s*start/)
  })
  it('has no gradient and at most a faint shadow', () => {
    expect(card).not.toMatch(/gradient/)
    expect(card).toMatch(/box-shadow:\s*0 1px 2px rgba\(0, 0, 0, 0\.04\)/)
  })
  const rule = (selector: string) => new RegExp(`${selector.replace(/[.[\]]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(results)?.[1] ?? ''
  it('has a 2px solid border in the verdict border colour and a 30px radius', () => {
    expect(rule('.verdict')).toMatch(/border:\s*2px solid var\(--v-border\)/)
    expect(rule('.verdict')).toMatch(/border-radius:\s*var\(--radius-verdict\)/)
  })
  it('sets the headline to --fw-extrabold and keeps every other results.css weight at 600 or below', () => {
    expect(rule('.verdict h2')).toMatch(/font-weight:\s*var\(--fw-extrabold\)/)
    const others = [...results.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter((m) => m[1].trim() !== '.verdict h2')
    for (const [, sel, body] of others)
      for (const w of body.matchAll(/font-weight:\s*(\d+)/g)) expect(Number(w[1]), sel.trim()).toBeLessThanOrEqual(600)
  })
  it('draws the pill with the state bg, a 1px border and the state text colour', () => {
    expect(rule('.verdict-pill')).toMatch(/border:\s*1px solid var\(--v-border\)/)
    expect(rule('.verdict-pill')).toMatch(/background:\s*var\(--v-pill-bg\)/)
    expect(rule('.verdict-pill')).toMatch(/color:\s*var\(--v-pill-text\)/)
  })
  it('pulses the dot for 1.5-2s and stops the pulse under reduced motion', () => {
    const dot = rule('.verdict-dot')
    expect(dot).toMatch(/background:\s*var\(--v-pill-text\)/)
    expect(dot).toMatch(/box-shadow:/)
    const m = /animation:\s*verdict-dot-pulse\s+([\d.]+)s\s+ease-in-out\s+infinite/.exec(dot)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBeGreaterThanOrEqual(1.5)
    expect(Number(m![1])).toBeLessThanOrEqual(2)
    const reduced = results.slice(results.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toMatch(/\.verdict-dot\s*\{[^}]*animation:\s*none/)
  })
})
