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

  it('uses only palette colours (optionally with alpha) in eased multi-stop gradients ending in transparent', () => {
    const pal = ['#C4B5FD', '#93C5FD', '#86EFAC', '#FDBA9A', '#F9A8D4']
    const hexes = [...css.matchAll(/#[0-9a-f]+/gi)].map((m) => m[0].toUpperCase())
    for (const h of hexes) expect(pal).toContain(h.length === 9 ? h.slice(0, 7) : h)
    for (const h of hexes) expect([7, 9]).toContain(h.length)
    expect(new Set(hexes.map((h) => h.slice(0, 7)))).toEqual(new Set(pal))
    expect(css).not.toMatch(/rgba?\(|hsla?\(/i)
    expect(blobRules.length).toBeGreaterThanOrEqual(5)
    for (const r of blobRules) {
      const stops = /radial-gradient\(closest-side, ([^;]*)\);/.exec(r)![1].split(/,\s*(?![^(]*\))/)
      expect(stops.length).toBeGreaterThanOrEqual(5)
      const parsed = stops.map((s) => /^(#[0-9A-F]{6})([0-9A-F]{2})?(?: (\d+)%)?$/i.exec(s.trim()) ?? /^(transparent) (\d+)%$/.exec(s.trim())!)
      expect(parsed.every(Boolean)).toBe(true)
      const alphas = stops.map((s) => (s.startsWith('transparent') ? 0 : /^#[0-9A-F]{6}([0-9A-F]{2})/i.test(s.trim()) ? parseInt(s.trim().slice(7, 9), 16) : 255))
      for (let i = 1; i < alphas.length; i++) expect(alphas[i]).toBeLessThanOrEqual(alphas[i - 1])
      expect(alphas.at(-1)).toBe(0)
      expect(+/(\d+)%$/.exec(stops.at(-1)!)![1]).toBeLessThanOrEqual(100)
      const pos = stops.map((s) => +(/(\d+)%$/.exec(s.trim())?.[1] ?? 0))
      stops.forEach((_, i) => { if (pos[i] > 30) expect(alphas[i]).toBeLessThan(255) })
      // eased, not linear: the drop over the first half differs from a straight ramp
      const mid = alphas[Math.floor(alphas.length / 2)]
      expect(Math.abs(mid - 127.5)).toBeGreaterThan(5)
      expect(new Set(stops.map((s) => s.trim().slice(0, 7))).size).toBeLessThanOrEqual(2)
    }
  })

  it('blobs are elliptical, 300-600px, blurred 40-160px, opacity 0.35-0.45', () => {
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
    for (const b of blurs) expect(b >= 40 && b <= 160).toBe(true)
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

  it('has no clipping, containment or backdrop tricks', () => {
    expect(css).not.toMatch(/contain:|clip-path|backdrop-filter|translateZ|translate3d/)
    expect(css.match(/overflow:/g)).toHaveLength(1)
  })

  it('applies filter and opacity only to blobs', () => {
    const outside = css.replace(/\.ambient-blob\s*{[^}]*}/, '').replace(/@keyframes[^{]*{(?:[^{}]*{[^}]*})+\s*}/g, '')
    expect(outside).not.toMatch(/filter|opacity/)
  })
})
