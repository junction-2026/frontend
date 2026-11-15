import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/ambient.css', 'utf8')
const esc = (s: string) => s.replace(/[+.:()]/g, '\\$&')
const rule = (sel: string) => [...css.matchAll(new RegExp(`(?:^|\\n)${esc(sel)}\\s*{([^}]*)}`, 'g'))].map((m) => m[1]).join('\n')
const nrules = (cls: string) => [...css.matchAll(new RegExp(`\\n\\.${cls}-(\\d+)\\s*{([^}]*)}`, 'g'))].map((m) => m[2])
const glowRules = nrules('ambient-glow')
const cardRules = nrules('ambient-card')
const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)\s*{((?:[^{}]*{[^}]*})+)\s*}/g)].map((m) => ({ name: m[1], body: m[2] }))
const kf = (name: string) => keyframes.find((k) => k.name === name)!.body
const frames = (body: string) => [...body.matchAll(/([\d.%,\s]+){([^}]*)}/g)].map((m) => ({ keys: m[1].split(',').map((k) => k.trim()), decls: m[2] }))
const frame = (body: string, key: string) => frames(body).find((f) => f.keys.includes(key))!.decls.replace(/\s+/g, ' ').trim()
const num = (r: string, prop: string) => parseFloat(new RegExp(`${prop}:? ?(-?[\\d.]+)`).exec(r)![1])
const GLOWS = ['#DDD6FE', '#BFDBFE', '#D1FAE5', '#FFE4D6']
const media = (q: string) => new RegExp(`@media \\(${esc(q)}\\)\\s*{((?:[^{}]*{[^}]*})+)\\s*}`).exec(css)![1]

describe('ambient.css', () => {
  it('layer is fixed, clipped, click-through and below the content', () => {
    const layer = rule('.ambient-bg')
    for (const d of ['position: fixed', 'inset: 0', 'overflow: hidden', 'pointer-events: none', 'z-index: 0']) expect(layer).toContain(d)
    expect(rule('.ambient-bg + .view')).toMatch(/position: relative;[^]*z-index: 1/)
    expect(css).not.toMatch(/pointer-events: (auto|all)/)
  })

  it('uses only the 4 glow colours and white, with alpha, and no other colour notation', () => {
    const hexes = [...css.matchAll(/#[0-9a-f]+/gi)].map((m) => m[0].toUpperCase())
    for (const h of hexes) expect([7, 9]).toContain(h.length)
    for (const h of hexes) expect([...GLOWS, '#FFFFFF']).toContain(h.slice(0, 7))
    for (const c of [...GLOWS, '#FFFFFF']) expect(hexes.some((h) => h.startsWith(c))).toBe(true)
    expect(css).not.toMatch(/rgba?\(|hsla?\(/i)
    // highlight and badge colours come from the glow palette; text from existing tokens
    for (const r of cardRules.filter((r) => r.includes('--hl'))) expect(GLOWS).toContain(/--hl: (#[0-9A-F]{6})/i.exec(r)![1].toUpperCase())
    expect(css).toMatch(/color: var\(--ink/)
  })

  it('has 4 glows, each a distinct palette colour in an eased gradient ending in transparent', () => {
    expect(glowRules).toHaveLength(4)
    const colours = glowRules.map((r) => /radial-gradient\(closest-side, (#[0-9A-F]{6})/i.exec(r)![1].toUpperCase())
    expect([...colours].sort()).toEqual([...GLOWS].sort())
    for (const r of glowRules) {
      const stops = /radial-gradient\(closest-side, ([^;]*)\);/.exec(r)![1].split(/,\s*(?![^(]*\))/)
      expect(stops.length).toBeGreaterThanOrEqual(5)
      const alphas = stops.map((s) => (s.startsWith('transparent') ? 0 : /^#[0-9A-F]{6}([0-9A-F]{2})/i.test(s.trim()) ? parseInt(s.trim().slice(7, 9), 16) : 255))
      for (let i = 1; i < alphas.length; i++) expect(alphas[i]).toBeLessThanOrEqual(alphas[i - 1])
      expect(alphas.at(-1)).toBe(0)
      expect(+/(\d+)%$/.exec(stops.at(-1)!.trim())![1]).toBeLessThanOrEqual(100)
      const pos = stops.map((s) => +(/(\d+)%$/.exec(s.trim())?.[1] ?? 0))
      stops.forEach((_, i) => { if (pos[i] > 30) expect(alphas[i]).toBeLessThan(255) })
      expect(Math.abs(alphas[Math.floor(alphas.length / 2)] - 127.5)).toBeGreaterThan(5) // eased, not a straight ramp
      expect(new Set(stops.map((s) => s.trim().slice(0, 7))).size).toBeLessThanOrEqual(2)
    }
  })

  it('glows are 400-800px ellipses, 90vw max, with a static 60-160px blur and opacity 0.5-0.8', () => {
    for (const r of glowRules) {
      const w = num(r, 'width')
      const h = num(r, 'height')
      expect(w).not.toBe(h)
      expect(Math.max(w, h)).toBeGreaterThanOrEqual(400)
      expect(Math.max(w, h)).toBeLessThanOrEqual(800)
    }
    const base = rule('.ambient-glow')
    expect(base).toContain('position: absolute')
    expect(base).toContain('max-width: 90vw')
    expect(base).toContain('will-change: transform')
    expect(base).toContain('ease-in-out')
    expect(base).toContain('infinite')
    const blur = num(base, 'blur\\(')
    expect(blur >= 60 && blur <= 160).toBe(true)
    expect(num(base, 'opacity') >= 0.5 && num(base, 'opacity') <= 0.8).toBe(true)
  })

  it('each glow has its own transform-only 20-40s keyframes with equal 0% and 100% frames', () => {
    const names = glowRules.map((r) => /animation-name: ([\w-]+)/.exec(r)![1])
    const durations = glowRules.map((r) => num(r, 'animation-duration'))
    expect(new Set(names).size).toBe(4)
    expect(new Set(names.map((n, i) => `${n}/${durations[i]}`)).size).toBe(4)
    for (const d of durations) expect(d >= 20 && d <= 40).toBe(true)
    for (const n of names) {
      const body = kf(n)
      expect(new Set([...body.matchAll(/([\w-]+):/g)].map((m) => m[1]))).toEqual(new Set(['transform']))
      expect(frame(body, '0%')).toBe(frame(body, '100%'))
      for (const s of body.matchAll(/scale\(([\d.]+)\)/g)) expect(+s[1] >= 0.9 && +s[1] <= 1.15).toBe(true)
    }
  })

  it('has 4-6 cards, 200-280px wide, with a design-token radius and a static 0.5-3px blur', () => {
    expect(cardRules.length).toBeGreaterThanOrEqual(4)
    expect(cardRules.length).toBeLessThanOrEqual(6)
    const base = rule('.ambient-card')
    expect(base).toContain('will-change: transform, opacity')
    const blur = num(base, 'blur\\(')
    expect(blur >= 0.5 && blur <= 3).toBe(true)
    expect(base).toMatch(/--w: \d+px/)
    for (const r of cardRules) {
      const w = num(r, '--w')
      expect(w >= 200 && w <= 280).toBe(true)
    }
    expect(rule('.ambient-card-body')).toMatch(/border-radius: var\(--radius(-sm)?\)/)
    expect(rule('.ambient-card-body')).toContain('background: #FFFFFF')
  })

  it('places cards in edge columns on both sides, centre in the outer 15% and clear of the 760px column', () => {
    const left = rule('.ambient-card:nth-child(odd)')
    const right = rule('.ambient-card:nth-child(even)')
    for (const [side, r] of [['left', left], ['right', right]]) {
      expect(r).toContain(`${side}: min(calc(15% - var(--w) / 2), calc(50% - min(380px, 50% - 16px) - 56px - var(--w)))`)
    }
    // evaluate the placement at the contract widths: the card never reaches the 760px composer column (plus drift margin)
    for (const vw of [768, 1280, 1920]) {
      for (const w of cardRules.map((r) => num(r, '--w'))) {
        const edge = Math.min(0.15 * vw - w / 2, vw / 2 - Math.min(380, vw / 2 - 16) - 56 - w)
        expect(edge + w + 56).toBeLessThanOrEqual(vw / 2 - Math.min(380, vw / 2 - 16))
        expect(edge + w / 2).toBeLessThanOrEqual(0.15 * vw)
      }
    }
  })

  it('each card has its own 25-45s transform+opacity keyframes: distinct durations, negative delays, no jump', () => {
    const names = cardRules.map((r) => /animation-name: ([\w-]+)/.exec(r)![1])
    const durations = cardRules.map((r) => num(r, 'animation-duration'))
    expect(new Set(names).size).toBe(cardRules.length)
    expect(new Set(durations).size).toBe(cardRules.length)
    for (const d of durations) expect(d >= 25 && d <= 45).toBe(true)
    for (const r of cardRules) expect(num(r, 'animation-delay')).toBeLessThan(0)
    const base = rule('.ambient-card')
    expect(base).toMatch(/animation-timing-function: (linear|ease-in-out)/)
    expect(base).toContain('animation-iteration-count: infinite')
    for (const n of names) {
      const body = kf(n)
      expect(new Set([...body.matchAll(/([\w-]+):/g)].map((m) => m[1]))).toEqual(new Set(['transform', 'opacity']))
      expect(frame(body, '0%')).toContain('opacity: 0')
      expect(frame(body, '100%')).toContain('opacity: 0')
      expect(frame(body, '0%')).toMatch(/translate\(0, -\d+px\)/) // starts above the viewport
      expect(frame(body, '100%')).toMatch(/translate\(0, calc\(100vh \+ \d+px\)\)/) // ends below it
      const peak = num(frame(body, '12%'), 'opacity')
      expect(peak >= 0.35 && peak <= 0.6).toBe(true)
      for (const m of body.matchAll(/rotate\((-?[\d.]+)deg\)/g)) expect(Math.abs(+m[1])).toBeLessThanOrEqual(3)
      const xs = [...body.matchAll(/translate\((-?[\d.]+)px,/g)].map((m) => +m[1])
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(40)
    }
  })

  it('runs the highlight and badge sequence on a shared cycle with one slot per card, only opacity and transform', () => {
    const seq = cardRules.filter((r) => r.includes('--seq'))
    expect(seq.length).toBeGreaterThanOrEqual(2)
    const slots = seq.map((r) => 180 + num(r, '--seq')) // start second of each 10s sequence within the 180s cycle
    slots.sort((a, b) => a - b)
    slots.forEach((s, i) => expect(((slots[(i + 1) % slots.length] - s) % 180 + 180) % 180).toBeGreaterThanOrEqual(10))
    for (const n of ['ambient-hl-fill', 'ambient-hl-glow', 'ambient-badge-pop']) {
      const props = new Set([...kf(n).matchAll(/([\w-]+):/g)].map((m) => m[1]))
      for (const p of props) expect(['opacity', 'transform']).toContain(p)
    }
    expect(kf('ambient-badge-pop')).toMatch(/scale\(0\.96\)[^]*scale\(1\)/)
    expect(css).toMatch(/\.ambient-card \.ambient-hl::after\s*{[^}]*box-shadow/)
    expect(rule('.ambient-card .ambient-badge-neutral')).toContain('opacity: 1')
  })

  it('has a static white veil: no animation, no blur', () => {
    const r = rule('.ambient-veil')
    expect(r).toMatch(/radial-gradient\(ellipse[^;]*#FFFFFF[^;]*transparent 100%\)/)
    expect(r).not.toMatch(/animation|filter|blur|opacity/)
    expect(rule('.ambient-glows,\n.ambient-cards,\n.ambient-veil')).toContain('position: absolute')
  })

  it('no filter or blur inside any @keyframes', () => {
    expect(keyframes.length).toBeGreaterThanOrEqual(13)
    for (const k of keyframes) expect(k.body).not.toMatch(/filter|blur/)
  })

  it('limits cards below 768px (at most 2, dimmer) and hides them below 480px', () => {
    const small = media('max-width: 767px')
    expect(small).toMatch(/\.ambient-card:nth-child\(n \+ 3\)\s*{\s*display: none/) // only cards 1 and 2 remain
    expect(small).toMatch(/\.ambient-card-body\s*{\s*opacity: 0\.[1-6]/)
    expect(media('max-width: 479px')).toMatch(/\.ambient-card\s*{\s*display: none/)
    expect(small).not.toMatch(/\.ambient-(glow|veil)/)
  })

  it('stops every glow, card, highlight and badge under prefers-reduced-motion, keeping glows and veil visible', () => {
    const block = /@media \(prefers-reduced-motion: reduce\)\s*{([^]*)}\s*$/.exec(css)![1]
    const sels = /([^{]*){\s*animation: none;\s*}/.exec(block)![1]
    for (const s of ['.ambient-glow', '.ambient-card', '.ambient-card .ambient-hl::before', '.ambient-card .ambient-hl::after', '.ambient-card .ambient-badge:not(.ambient-badge-neutral)'])
      expect(sels.split(',').map((x) => x.trim())).toContain(s)
    expect(block).toMatch(/\.ambient-card\s*{\s*display: none;\s*}/)
    expect(block).not.toMatch(/\.ambient-(glow|veil)[^,{]*{[^}]*(display|opacity|visibility)/)
    expect(block).not.toMatch(/ambient-veil|ambient-glows/)
  })

  it('has no clipping, containment, backdrop or 3D tricks', () => {
    expect(css).not.toMatch(/contain:|clip-path|backdrop-filter|translateZ|translate3d|perspective|url\(#/)
    expect(css.match(/overflow:/g)).toHaveLength(1)
    expect(css).not.toMatch(/@import|animation-name: [^;]*,/)
  })

  it('applies filter and opacity only to glows, cards, their descendants and the veil', () => {
    const outside = css
      .replace(/@keyframes[^{]*{(?:[^{}]*{[^}]*})+\s*}/g, '')
      .replace(/(?:^|\n)(?:[^{}\n@][^{}]*)?\.ambient-(?:glow|card|veil)[^{}]*{[^}]*}/g, '')
    expect(outside).not.toMatch(/filter|opacity|blur/)
    // nothing in this stylesheet may target real UI elements
    const selectors = [...css.replace(/\/\*[^]*?\*\//g, '').replace(/@keyframes[^{]*{(?:[^{}]*{[^}]*})+\s*}/g, '').matchAll(/(?:^|[{}])\s*([^{}@]+){/g)].map((m) => m[1].trim()).filter(Boolean)
    for (const s of selectors.flatMap((x) => x.split(','))) expect(s.trim()).toMatch(/\.ambient-/)
  })
})
