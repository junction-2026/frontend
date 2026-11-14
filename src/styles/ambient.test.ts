import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/ambient.css', 'utf8')
const rule = (sel: string) => new RegExp(`(?:^|\\n)${sel.replace(/[+.]/g, '\\$&')}\\s*{([^}]*)}`).exec(css)![1]
const blobRules = [...css.matchAll(/\n\.ambient-blob-\d+\s*{([^}]*)}/g)].map((m) => m[1])
const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)\s*{((?:[^{}]*{[^}]*})+)\s*}/g)]

describe('ambient.css', () => {
  it('layer is fixed, clipped, click-through and below the content', () => {
    const layer = rule('.ambient-bg')
    for (const d of ['position: fixed', 'inset: 0', 'overflow: hidden', 'pointer-events: none', 'z-index: 0']) expect(layer).toContain(d)
    expect(rule('.ambient-bg + .view')).toMatch(/position: relative;[^]*z-index: 1/)
  })

  it('uses exactly the five palette colours as radial gradients to transparent', () => {
    const hexes = new Set([...css.matchAll(/#[0-9a-f]{6}/gi)].map((m) => m[0].toUpperCase()))
    expect(hexes).toEqual(new Set(['#C4B5FD', '#93C5FD', '#86EFAC', '#FDBA9A', '#F9A8D4']))
    expect(blobRules.length).toBeGreaterThanOrEqual(5)
    for (const r of blobRules) expect(r).toMatch(/radial-gradient\(closest-side, #[0-9A-F]{6} \d+%, transparent\)/i)
  })

  it('blobs are elliptical, 300-600px, blurred 100-160px, opacity 0.35-0.45', () => {
    for (const r of blobRules) {
      const w = parseInt(/width: (\d+)px/.exec(r)![1])
      const h = parseInt(/height: (\d+)px/.exec(r)![1])
      expect(w).not.toBe(h)
      expect(Math.max(w, h)).toBeGreaterThanOrEqual(300)
      expect(Math.max(w, h)).toBeLessThanOrEqual(600)
    }
    const base = rule('.ambient-blob')
    expect(base).toContain('position: absolute')
    expect(base).toContain('will-change: transform')
    expect(base).toContain('ease-in-out')
    expect(base).toContain('infinite')
    const blurs = [...css.matchAll(/blur\((\d+)px\)/g)].map((m) => +m[1])
    expect(blurs.length).toBeGreaterThan(0)
    for (const b of blurs) expect(b >= 100 && b <= 160).toBe(true)
    const opacity = +/opacity: ([\d.]+)/.exec(base)![1]
    expect(opacity >= 0.35 && opacity <= 0.45).toBe(true)
  })

  it('has edge-anchored blobs and one behind the hero', () => {
    expect(blobRules.some((r) => /left: -\d+px/.test(r))).toBe(true)
    expect(blobRules.some((r) => /right: -\d+px/.test(r))).toBe(true)
    expect(blobRules.some((r) => /left: (3\d|4\d|5\d)%/.test(r))).toBe(true)
  })

  it('each blob has its own seamless transform-only keyframes and 18-35s duration', () => {
    const names = blobRules.map((r) => /animation-name: ([\w-]+)/.exec(r)![1])
    const durations = blobRules.map((r) => parseFloat(/animation-duration: ([\d.]+)s/.exec(r)![1]))
    expect(new Set(names).size).toBe(names.length)
    expect(new Set(blobRules.map((r, i) => `${names[i]}/${durations[i]}/${/animation-delay: ([-\d.]+)s/.exec(r)?.[1]}`)).size).toBe(names.length)
    for (const d of durations) expect(d >= 18 && d <= 35).toBe(true)
    expect(keyframes.map((k) => k[1]).sort()).toEqual([...names].sort())
    for (const [, , body] of keyframes) {
      const decls = [...body.matchAll(/([\w-]+):/g)].map((m) => m[1])
      expect(new Set(decls)).toEqual(new Set(['transform']))
      const first = /0%,\s*100%\s*{[^}]*}/.test(body)
      expect(first).toBe(true)
      for (const s of body.matchAll(/scale\(([\d.]+)\)/g)) expect(+s[1] >= 0.9 && +s[1] <= 1.15).toBe(true)
    }
  })

  it('disables animation under prefers-reduced-motion without hiding blobs', () => {
    const block = /@media \(prefers-reduced-motion: reduce\)\s*{([^]*)}\s*$/.exec(css)![1]
    expect(block).toMatch(/\.ambient-blob\s*{\s*animation: none;\s*}/)
    expect(block).not.toMatch(/opacity|display|visibility/)
  })

  it('applies filter and opacity only to blobs', () => {
    const outside = css.replace(/\.ambient-blob\s*{[^}]*}/, '').replace(/@keyframes[^{]*{(?:[^{}]*{[^}]*})+\s*}/g, '')
    expect(outside).not.toMatch(/filter|opacity/)
  })
})
