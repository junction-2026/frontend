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

describe('verdict tokens', () => {
  it.each(['detected', 'uncertain', 'not-detected'])('%s: heading, text and pill text reach 4.5:1', (state) => {
    const t = (n: string) => token(`verdict-${state}-${n}`)
    for (const n of ['bg', 'border', 'heading', 'text', 'pill-bg', 'pill-text']) expect(t(n), n).toMatch(/^#/)
    expect(contrast(t('heading'), t('bg'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t('text'), t('bg'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t('pill-text'), t('pill-bg'))).toBeGreaterThanOrEqual(4.5)
  })

  it('uses a 30px verdict radius', () => expect(css).toMatch(/--radius-verdict:\s*30px/))
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
})
