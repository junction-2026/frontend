import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ArchiveBackground } from '../ui/ArchiveBackground'

const css = readFileSync('src/styles/archive-bg.css', 'utf8')
const esc = (s: string) => s.replace(/[+.:()[\]'"=*]/g, '\\$&')
const rule = (sel: string) => [...css.matchAll(new RegExp(`(?:^|\\n)\\s*${esc(sel)}\\s*{([^}]*)}`, 'g'))].map((m) => m[1]).join('\n')
const bare = css.replace(/\/\*[^]*?\*\//g, '')
const media = (q: string) => new RegExp(`@media ${esc(q)}\\s*{((?:[^{}]*{[^}]*})+)\\s*}`).exec(css)![1]
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lum = (c: number[]) => c.map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0)
const ratio = (a: number[], b: number[]) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)

// Light warm-neutral: every channel >= 0xC8, R >= G >= B, R - B <= 0x18, and low contrast against the page background.
function expectLightWarm(h: string) {
  expect([7, 9]).toContain(h.length)
  const [r, g, b] = rgb(h)
  expect(Math.min(r, g, b)).toBeGreaterThanOrEqual(0xc8)
  expect(r).toBeGreaterThanOrEqual(g)
  expect(g).toBeGreaterThanOrEqual(b)
  expect(r - b).toBeLessThanOrEqual(0x18)
  expect(ratio(rgb(h), rgb('#FAFAF9'))).toBeLessThanOrEqual(1.6)
}

describe('archive-bg.css', () => {
  it('layer is fixed, clipped, click-through and below the content; no pointer-events re-enable', () => {
    const layer = rule('.archive-bg')
    for (const d of ['position: fixed', 'inset: 0', 'overflow: hidden', 'pointer-events: none', 'z-index: 0']) expect(layer).toContain(d)
    expect(rule('.archive-bg + .view')).toMatch(/position: relative;[^]*z-index: 1/)
    expect(css).not.toMatch(/pointer-events: (auto|all)/)
    expect(css).not.toMatch(/(^|[\s;])(left|right):/)
    expect(css).not.toContain('--flip')
  })

  it('every selector targets .archive-*; no images, canvas, rgb()/hsl() or cool colours', () => {
    const selectors = [...bare.matchAll(/(?:^|[{}])\s*([^{}@]+){/g)].map((m) => m[1].trim()).filter((s) => s && !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(3)
    for (const s of selectors.flatMap((x) => x.split(','))) expect(s.trim()).toMatch(/\.archive-/)
    expect(bare).not.toMatch(/url\(|background-image|image-set|canvas|@import|rgba?\(|hsla?\(|gradient/i)
    expect(bare).not.toMatch(/\b(blue|purple|violet|green|cyan|teal)\b/i)
  })

  it('room is var(--bg); any hex colour is light warm-neutral with contrast <= 1.6 vs #FAFAF9', () => {
    expect(rule('.archive-room')).toContain('background: var(--bg)')
    for (const h of bare.match(/#[0-9a-f]+/gi) ?? []) expectLightWarm(h)
  })

  it('every SVG fill and stroke from the component satisfies the same palette rule', () => {
    const html = renderToStaticMarkup(createElement(ArchiveBackground))
    const hexes = [...html.matchAll(/(?:fill|stroke)="(#[0-9a-f]+)"/gi)].map((m) => m[1])
    expect(hexes.length).toBeGreaterThan(10)
    for (const h of hexes) expectLightWarm(h)
    expect([...html.matchAll(/(?:fill|stroke)="([^"]+)"/g)].every((m) => m[1] === 'none' || m[1].startsWith('#') || m[1].startsWith('var(--'))).toBe(true)
  })

  it('is static: no keyframes, will-change, filter, blur, vignette or dark shadow; animation only in guards', () => {
    expect(bare).not.toMatch(/@keyframes|will-change|filter|blur\(|vignette|mix-blend-mode/)
    for (const m of bare.matchAll(/box-shadow:[^;]*#([0-9a-f]{6})([0-9a-f]{2})?/gi)) expect(parseInt(m[2] ?? 'ff', 16)).toBeLessThanOrEqual(0x14)
    const decls = [...bare.matchAll(/(?:^|[;{\s])(animation[\w-]*|transition[\w-]*):\s*([^;]+);/g)].map((m) => `${m[1]}: ${m[2]}`).sort()
    expect(decls).toEqual(['animation-play-state: paused', 'animation: none', 'transition: none'])
  })

  it('scrim is an opaque centred var(--surface) reading column', () => {
    const s = rule('.archive-scrim')
    for (const d of ['inset-inline: 0', 'margin-inline: auto', 'width: min(calc(var(--max) + 3rem), 100%)', 'inset-block: 0', 'background: var(--surface)', 'border-inline: 1px solid var(--line)']) expect(s).toContain(d)
    expect(s).not.toMatch(/box-shadow/)
    for (const ink of ['#171717', '#3A3A3A', '#737373']) expect(ratio(rgb(ink), rgb('#FFFFFF'))).toBeGreaterThanOrEqual(4.5)
  })

  it('stops every animation and transition under prefers-reduced-motion without hiding anything', () => {
    const block = media('(prefers-reduced-motion: reduce)')
    expect(block).toMatch(/\.archive-bg \*[^{]*{\s*animation: none;\s*transition: none/)
    expect(block).not.toMatch(/display|visibility|opacity/)
    for (const s of block.matchAll(/([^{}]+){/g)) expect(s[1]).toMatch(/\.archive-/)
  })

  it('pauses every animation while archive-paused', () => {
    expect(css).toMatch(/\.archive-paused,\s*\.archive-paused \*\s*{\s*animation-play-state: paused/)
  })

  it('narrow viewports: full-width scrim without side borders', () => {
    expect(media('(max-width: 640px)')).toMatch(/\.archive-scrim\s*{\s*width: 100%;\s*border-inline: 0/)
  })
})
