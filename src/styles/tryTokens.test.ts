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
describe('try-out chip tokens', () => {
  const STATES = ['detected', 'not-detected', 'uncertain']

  it.each(STATES)('%s: text reaches 4.5:1 on bg, and bg/border are lighter than the verdict tokens', (s) => {
    const t = (n: string) => token(`try-${s}-${n}`)
    const v = (n: string) => token(`verdict-${s}-${n}`)
    for (const n of ['bg', 'border', 'text']) expect(t(n), n).not.toBe('')
    expect(contrast(t('text'), t('bg'))).toBeGreaterThanOrEqual(4.5)
    expect(luminance(t('bg'))).toBeGreaterThan(luminance(v('bg')))
    expect(luminance(t('border'))).toBeGreaterThan(luminance(v('border')))
  })

  it('keeps red, green and amber hue families with three distinct backgrounds', () => {
    const bgs = STATES.map((s) => token(`try-${s}-bg`))
    expect(new Set(bgs).size).toBe(3)
    const [r, g, b] = bgs.map((x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16)))
    expect(r[0] > r[1] && r[1] === r[2]).toBe(true) // red: R above G=B
    expect(g[1] > g[0] && g[1] > g[2]).toBe(true) // green: G dominant
    expect(b[0] > b[1] && b[1] > b[2]).toBe(true) // amber: R > G > B
  })

  it('leaves the verdict tokens used by result views unchanged', () => {
    expect([token('verdict-detected-bg'), token('verdict-detected-border')]).toEqual(['#fde8e8', '#f5b8b8'])
    expect([token('verdict-not-detected-bg'), token('verdict-not-detected-border')]).toEqual(['#e5f7ec', '#a8e4bf'])
    expect([token('verdict-uncertain-bg'), token('verdict-uncertain-border')]).toEqual(['#fff1dc', '#f2d49b'])
  })
})
