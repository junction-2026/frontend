import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/explore-veil.css', 'utf8')
const esc = (s: string) => s.replace(/[+.:()[\]'"=*]/g, '\\$&')
const rule = (sel: string) => [...css.matchAll(new RegExp(`(?:^|\\n)\\s*${esc(sel)}\\s*{([^}]*)}`, 'g'))].map((m) => m[1]).join('\n')
const PALETTE = ['#FFFFFF', '#F4F1EC', '#E9E5DE', '#DCD8D1']

describe('explore-veil.css', () => {
  it('layer is fixed, clipped, click-through, white and below the content; no pointer-events re-enable', () => {
    const layer = rule('.explore-veil')
    for (const d of ['position: fixed', 'inset: 0', 'overflow: hidden', 'pointer-events: none', 'z-index: 0', 'background: #FFFFFF']) expect(layer).toContain(d)
    expect(rule('.explore-veil + .view')).toMatch(/position: relative;[^]*z-index: 1/)
    expect(css).not.toMatch(/pointer-events: (auto|all)/)
  })

  it('canvas fills the layer as a block', () => {
    const c = rule('.explore-veil-canvas')
    for (const d of ['display: block', 'position: absolute', 'inset: 0', 'width: 100%', 'height: 100%']) expect(c).toContain(d)
  })

  it('uses only neutral palette hexes (with alpha), each channel >= 0xD0; every selector targets .explore-veil*', () => {
    const hexes = [...css.matchAll(/#[0-9a-f]+/gi)].map((m) => m[0].toUpperCase())
    for (const h of hexes) {
      expect([7, 9]).toContain(h.length)
      expect(PALETTE).toContain(h.slice(0, 7))
      for (const i of [1, 3, 5]) expect(parseInt(h.slice(i, i + 2), 16)).toBeGreaterThanOrEqual(0xd0)
    }
    for (const c of PALETTE) expect(hexes.some((h) => h.startsWith(c))).toBe(true)
    expect(css).not.toMatch(/rgba?\(|hsla?\(/i)
    const bare = css.replace(/\/\*[^]*?\*\//g, '')
    const selectors = [...bare.matchAll(/(?:^|[{}])\s*([^{}@]+){/g)].map((m) => m[1].trim()).filter(Boolean)
    expect(selectors.length).toBeGreaterThanOrEqual(4)
    for (const s of selectors.flatMap((x) => x.split(','))) expect(s.trim()).toMatch(/\.explore-veil/)
  })

  it('fallback is a static fabric: layered linear and radial gradients with 4+ fold bands', () => {
    const r = rule('.explore-veil-fallback')
    expect(r.match(/linear-gradient\(/g)!.length).toBeGreaterThanOrEqual(2)
    expect(r).toContain('radial-gradient(')
    expect([...r.matchAll(/#[0-9A-F]{8}\s+\d+%/gi)].length).toBeGreaterThanOrEqual(8)
  })

  it('declares no animation, keyframes or transition except the reduced-motion "none" reset; old panel veil is gone', () => {
    expect(css).not.toMatch(/@keyframes/)
    expect(css.replace(/\/\*[^]*?\*\//g, '').replace(/animation: none|transition: none/g, '')).not.toMatch(/animation|transition/)
    expect(css).not.toMatch(/explore-veil-(truth|panel)/)
  })

  it('stops animation and transition for .explore-veil * under prefers-reduced-motion', () => {
    const block = /@media \(prefers-reduced-motion: reduce\)\s*{([^]*)}\s*$/.exec(css)![1]
    expect(/([^{]*){/.exec(block)![1].trim()).toBe('.explore-veil *')
    expect(block).toMatch(/animation: none;\s*transition: none;/)
    expect(block).not.toMatch(/display|visibility|opacity/)
  })
})
