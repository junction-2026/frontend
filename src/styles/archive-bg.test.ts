import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/archive-bg.css', 'utf8')
const esc = (s: string) => s.replace(/[+.:()[\]'"=]/g, '\\$&')
const rule = (sel: string) => [...css.matchAll(new RegExp(`(?:^|\\n)\\s*${esc(sel)}\\s*{([^}]*)}`, 'g'))].map((m) => m[1]).join('\n')
const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)\s*{((?:[^{}]*{[^}]*})+)\s*}/g)].map((m) => ({ name: m[1], body: m[2] }))
const PALETTE = ['#DDD6FE', '#BFDBFE', '#D1FAE5', '#FFE4D6', '#FFFFFF']
const bare = css.replace(/\/\*[^]*?\*\//g, '')
const outsideKeyframes = bare.replace(/@keyframes[^{]*{(?:[^{}]*{[^}]*})+\s*}/g, '')
const media = (q: string) => new RegExp(`@media ${esc(q)}\\s*{((?:[^{}]*{[^}]*})+)\\s*}`).exec(css)![1]

describe('archive-bg.css', () => {
  it('layer is fixed, clipped, click-through and below the content; no pointer-events re-enable', () => {
    const layer = rule('.archive-bg')
    for (const d of ['position: fixed', 'inset: 0', 'overflow: hidden', 'pointer-events: none', 'z-index: 0']) expect(layer).toContain(d)
    expect(rule('.archive-bg + .view')).toMatch(/position: relative;[^]*z-index: 1/)
    expect(css).not.toMatch(/pointer-events: (auto|all)/)
  })

  it('uses only palette hexes (with alpha) and no other colour notation, images or masks; every selector targets .archive-*', () => {
    const hexes = [...css.matchAll(/#[0-9a-f]+/gi)].map((m) => m[0].toUpperCase())
    for (const h of hexes) {
      expect([7, 9]).toContain(h.length)
      expect(PALETTE).toContain(h.slice(0, 7))
    }
    for (const c of PALETTE) expect(hexes.some((h) => h.startsWith(c))).toBe(true)
    expect(css).not.toMatch(/rgba?\(|hsla?\(|background-image|mask-image|repeating-|url\(/i)
    const selectors = [...outsideKeyframes.matchAll(/(?:^|[{}])\s*([^{}@]+){/g)].map((m) => m[1].trim()).filter((s) => s && !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(10)
    for (const s of selectors.flatMap((x) => x.split(','))) expect(s.trim()).toMatch(/\.archive-/)
  })

  it('documents are subtle: opacity 0.25-0.6, blur at most 6px; veil is a white gradient above them', () => {
    const doc = rule('.archive-doc')
    const op = parseFloat(/opacity: ([\d.]+)/.exec(doc)![1])
    expect(op).toBeGreaterThanOrEqual(0.25)
    expect(op).toBeLessThanOrEqual(0.6)
    expect(parseFloat(/filter: blur\(([\d.]+)px\)/.exec(doc)![1])).toBeLessThanOrEqual(6)
    expect(rule('.archive-veil')).toMatch(/background: linear-gradient\((?:[^()]|\([^)]*\))*\)/)
    expect(rule('.archive-veil').match(/#[0-9A-F]+/gi)!.every((h) => /^#FFFFFF/i.test(h))).toBe(true)
    // veil follows the docs in the DOM; filter/opacity live only in .archive-doc and .archive-veil
    for (const m of outsideKeyframes.matchAll(/([^{}]+){([^}]*)}/g)) {
      if (/(^|[\s;])(filter|opacity):/.test(m[2])) expect(m[1].trim()).toMatch(/^\.archive-(doc|veil)$/)
    }
  })

  it('motion is transform-only, rotate at most 3deg, 30-60s ease-in-out infinite, resting frames equal', () => {
    expect(keyframes.length).toBeGreaterThan(0)
    for (const k of keyframes) {
      const decls = [...k.body.matchAll(/([\d.%,\s]+){([^}]*)}/g)].map((m) => ({ keys: m[1].replace(/\s/g, ''), body: m[2].trim() }))
      expect(decls.find((f) => f.keys === '0%,100%')).toBeTruthy()
      for (const f of decls) {
        expect([...f.body.matchAll(/([\w-]+):/g)].map((m) => m[1])).toEqual(['transform'])
        for (const d of f.body.matchAll(/rotate\((-?[\d.]+)deg\)/g)) expect(Math.abs(parseFloat(d[1]))).toBeLessThanOrEqual(3)
      }
    }
    const anims = [...outsideKeyframes.matchAll(/animation: ([\w-]+) ([\d.]+)s ease-in-out infinite/g)]
    expect(anims.length).toBe(6)
    for (const [, name, s] of anims) {
      expect(keyframes.map((k) => k.name)).toContain(name)
      expect(+s).toBeGreaterThanOrEqual(30)
      expect(+s).toBeLessThanOrEqual(60)
    }
  })

  it('stops every animation under prefers-reduced-motion without hiding anything', () => {
    const block = media('(prefers-reduced-motion: reduce)')
    expect(block).toMatch(/animation: none/)
    expect(block).not.toMatch(/display|visibility|opacity/)
    for (const s of block.matchAll(/([^{}]+){/g)) expect(s[1]).toMatch(/\.archive-/)
  })

  it('shows at most 3 documents at max-width 640px and mirrors offsets logically', () => {
    const block = media('(max-width: 640px)')
    expect(block).toMatch(/\.archive-doc:nth-child\(n \+ 4\)\s*{\s*display: none/)
    for (let n = 1; n <= 6; n++) expect(rule(`.archive-doc-${n}`)).toMatch(/inset-inline-(start|end)/)
    expect(css).not.toMatch(/(^|[\s;])(left|right):/)
    expect(rule("[dir='rtl'] .archive-bg")).toContain('--flip: -1')
  })
})
