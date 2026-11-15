import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/explore-veil.css', 'utf8')
const esc = (s: string) => s.replace(/[+.:()[\]'"=]/g, '\\$&')
const rule = (sel: string) => [...css.matchAll(new RegExp(`(?:^|\\n)${esc(sel)}\\s*{([^}]*)}`, 'g'))].map((m) => m[1]).join('\n')
const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)\s*{((?:[^{}]*{[^}]*})+)\s*}/g)].map((m) => ({ name: m[1], body: m[2] }))
const kf = (name: string) => keyframes.find((k) => k.name === name)!.body
const frames = (body: string) => [...body.matchAll(/([\d.%,\s]+){([^}]*)}/g)].map((m) => ({ keys: m[1].split(',').map((k) => k.trim()).filter(Boolean), decls: m[2].replace(/\s+/g, ' ').trim() }))
const frame = (body: string, key: string) => frames(body).find((f) => f.keys.includes(key))!.decls
const props = (body: string) => new Set([...body.matchAll(/([\w-]+):/g)].map((m) => m[1]))
const anim = (sel: string) => /animation: ([\w-]+) ([\d.]+)s ease-in-out infinite/.exec(rule(sel))!
const PALETTE = ['#DDD6FE', '#BFDBFE', '#FFFFFF']
const N = [1, 2, 3]

describe('explore-veil.css', () => {
  it('layer is fixed, clipped, click-through and below the content; no pointer-events re-enable', () => {
    const layer = rule('.explore-veil')
    for (const d of ['position: fixed', 'inset: 0', 'overflow: hidden', 'pointer-events: none', 'z-index: 0']) expect(layer).toContain(d)
    expect(rule('.explore-veil + .view')).toMatch(/position: relative;[^]*z-index: 1/)
    expect(css).not.toMatch(/pointer-events: (auto|all)/)
  })

  it('uses only palette hexes (with alpha) and no other colour notation; every selector targets .explore-veil*', () => {
    const hexes = [...css.matchAll(/#[0-9a-f]+/gi)].map((m) => m[0].toUpperCase())
    for (const h of hexes) {
      expect([7, 9]).toContain(h.length)
      expect(PALETTE).toContain(h.slice(0, 7))
    }
    for (const c of PALETTE) expect(hexes.some((h) => h.startsWith(c))).toBe(true)
    expect(css).not.toMatch(/rgba?\(|hsla?\(/i)
    const bare = css.replace(/\/\*[^]*?\*\//g, '').replace(/@keyframes[^{]*{(?:[^{}]*{[^}]*})+\s*}/g, '')
    const selectors = [...bare.matchAll(/(?:^|[{}])\s*([^{}@]+){/g)].map((m) => m[1].trim()).filter(Boolean)
    expect(selectors.length).toBeGreaterThan(5)
    for (const s of selectors.flatMap((x) => x.split(','))) expect(s.trim()).toMatch(/\.explore-veil/)
  })

  it('panels are translucent folded cloth: 4+ alternating bands, opacity 0.15-0.4, static blur at most 40px', () => {
    const panel = rule('.explore-veil-panel')
    const op = parseFloat(/opacity: ([\d.]+)/.exec(panel)![1])
    expect(op >= 0.15 && op <= 0.4).toBe(true)
    expect(panel).toContain('will-change: transform')
    const cloth = rule('.explore-veil-panel::before')
    expect(cloth.match(/linear-gradient\(/g)!.length).toBeGreaterThanOrEqual(2)
    const stops = [...cloth.matchAll(/#[0-9A-F]{6}([0-9A-F]{2})\s+\d+%/gi)].map((m) => m[0].slice(0, 7).toUpperCase())
    expect(stops.filter((c) => c !== '#FFFFFF').length).toBeGreaterThanOrEqual(4) // darker fold bands...
    expect(stops.filter((c) => c === '#FFFFFF').length).toBeGreaterThanOrEqual(4) // ...alternating with light ones
    for (const m of css.matchAll(/blur\((\d+)px\)/g)) expect(+m[1]).toBeLessThanOrEqual(40)
  })

  it('truth glow is a static palette radial gradient at opacity at most 0.5', () => {
    const r = rule('.explore-veil-truth')
    expect(r).toContain('radial-gradient(')
    expect(parseFloat(/opacity: ([\d.]+)/.exec(r)![1])).toBeLessThanOrEqual(0.5)
    expect(r).not.toMatch(/animation|filter/)
  })

  it('each panel sways with its own transform-only 8-16s keyframes and equal 0%/100% frames', () => {
    const a = N.map((n) => anim(`.explore-veil-panel-${n}::before`))
    expect(new Set(a.map((x) => x[1])).size).toBe(N.length)
    expect(new Set(a.map((x) => x[2])).size).toBe(N.length)
    for (const [, name, d] of a) {
      expect(+d >= 8 && +d <= 16).toBe(true)
      const body = kf(name)
      expect(props(body)).toEqual(new Set(['transform']))
      expect(frame(body, '0%')).toBe(frame(body, '100%'))
      for (const m of body.matchAll(/skewX\((-?[\d.]+)deg\)/g)) expect(Math.abs(+m[1])).toBeLessThanOrEqual(3)
      for (const m of body.matchAll(/scaleY\(([\d.]+)\)/g)) expect(+m[1] >= 0.98 && +m[1] <= 1.03).toBe(true)
    }
  })

  it('each panel reveals on its own 15-30s transform+opacity cycle: held closed, parts 3-6s by 25-50%, same rest frame', () => {
    const a = N.map((n) => anim(`.explore-veil-panel-${n}`))
    expect(new Set(a.map((x) => x[1])).size).toBe(N.length)
    expect(new Set(a.map((x) => x[2])).size).toBe(N.length)
    for (const [, name, d] of a) {
      expect(+d >= 15 && +d <= 30).toBe(true)
      const fr = frames(kf(name))
      expect(props(kf(name))).toEqual(new Set(['transform', 'opacity']))
      const rest = fr.find((f) => f.keys.includes('0%'))!
      expect(rest.keys).toContain('100%')
      const open = fr.find((f) => !f.keys.includes('0%'))!
      // parts: from the last closed keyframe before the open ones to the first closed one after them
      const pct = (k: string) => parseFloat(k)
      const closed = rest.keys.map(pct).sort((x, y) => x - y)
      const o = open.keys.map(pct)
      const start = Math.max(...closed.filter((k) => k < Math.min(...o)))
      const end = Math.min(...closed.filter((k) => k > Math.max(...o)))
      const secs = ((end - start) / 100) * +d
      expect(secs >= 3 && secs <= 6).toBe(true)
      expect(start).toBeGreaterThanOrEqual(50) // closed for most of the cycle
      const moved = [...open.decls.matchAll(/(-?\d+)%/g)].map((m) => Math.abs(+m[1])).filter((v) => v > 0 && v <= 50)
      expect(moved.length).toBeGreaterThan(0)
      for (const v of moved) expect(v >= 25 && v <= 50).toBe(true)
      expect(parseFloat(/opacity: ([\d.]+)/.exec(open.decls)![1])).toBeLessThan(parseFloat(/opacity: ([\d.]+)/.exec(rest.decls)![1]))
      expect(rest.decls).toContain('translate(0, 0)')
    }
  })

  it('rest opacity of every reveal equals the panel rest opacity; parting flips with the writing direction', () => {
    const op = /opacity: ([\d.]+)/.exec(rule('.explore-veil-panel'))![1]
    for (const n of N) expect(frame(kf(`explore-veil-reveal-${n}`), '0%')).toContain(`opacity: ${op}`)
    expect(rule("[dir='rtl'] .explore-veil")).toContain('--flip: -1')
    expect(rule('.explore-veil')).toContain('--flip: 1')
    expect(rule('.explore-veil-panel-1')).toContain('inset-inline-start')
    expect(rule('.explore-veil-panel-3')).toContain('inset-inline-end')
  })

  it('no filter or blur inside any @keyframes, and no JS-only hooks', () => {
    expect(keyframes).toHaveLength(6)
    for (const k of keyframes) expect(k.body).not.toMatch(/filter|blur/)
  })

  it('stops every veil animation under prefers-reduced-motion, keeping the panels visible', () => {
    const block = /@media \(prefers-reduced-motion: reduce\)\s*{([^]*)}\s*$/.exec(css)![1]
    const sels = /([^{]*){\s*animation: none;\s*}/.exec(block)![1].split(',').map((s) => s.trim())
    expect(sels).toEqual(['.explore-veil-panel', '.explore-veil-panel::before'])
    expect(block).not.toMatch(/display|visibility|opacity/)
  })
})
