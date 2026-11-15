import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/archive-bg.css', 'utf8')
const esc = (s: string) => s.replace(/[+.:()[\]'"=*]/g, '\\$&')
const rule = (sel: string) => [...css.matchAll(new RegExp(`(?:^|\\n)\\s*${esc(sel)}\\s*{([^}]*)}`, 'g'))].map((m) => m[1]).join('\n')
const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)\s*{((?:[^{}]*{[^}]*})+)\s*}/g)].map((m) => ({ name: m[1], body: m[2] }))
const bare = css.replace(/\/\*[^]*?\*\//g, '')
const outsideKeyframes = bare.replace(/@keyframes[^{]*{(?:[^{}]*{[^}]*})+\s*}/g, '')
const media = (q: string) => new RegExp(`@media ${esc(q)}\\s*{((?:[^{}]*{[^}]*})+)\\s*}`).exec(css)![1]
const seconds = (v: string) => (v.endsWith('ms') ? parseFloat(v) / 1000 : parseFloat(v))
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lum = (c: number[]) => c.map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0)
const ratio = (a: number[], b: number[]) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)

describe('archive-bg.css', () => {
  it('layer is fixed, clipped, click-through and below the content; no pointer-events re-enable', () => {
    const layer = rule('.archive-bg')
    for (const d of ['position: fixed', 'inset: 0', 'overflow: hidden', 'pointer-events: none', 'z-index: 0']) expect(layer).toContain(d)
    expect(rule('.archive-bg + .view')).toMatch(/position: relative;[^]*z-index: 1/)
    expect(css).not.toMatch(/pointer-events: (auto|all)/)
    expect(rule("[dir='rtl'] .archive-bg")).toContain('--flip: -1')
    expect(css).not.toMatch(/(^|[\s;])(left|right):/)
  })

  it('every selector targets .archive-*; only gradients, solids and warm hexes; no images or cool colours', () => {
    const selectors = [...outsideKeyframes.matchAll(/(?:^|[{}])\s*([^{}@]+){/g)].map((m) => m[1].trim()).filter((s) => s && !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(15)
    for (const s of selectors.flatMap((x) => x.split(','))) expect(s.trim()).toMatch(/\.archive-/)
    expect(css).not.toMatch(/url\(|background-image|image-set|canvas|@import|rgba?\(|hsla?\(/i)
    const hexes = [...bare.matchAll(/#[0-9a-f]+/gi)].map((m) => m[0])
    expect(hexes.length).toBeGreaterThan(5)
    for (const h of hexes) {
      expect([7, 9]).toContain(h.length)
      const [r, g, b] = rgb(h)
      expect(r).toBeGreaterThanOrEqual(g) // warm only: red >= green >= blue
      expect(g).toBeGreaterThanOrEqual(b)
    }
    for (const old of ['#DDD6FE', '#BFDBFE', '#D1FAE5', '#FFE4D6']) expect(css.toUpperCase()).not.toContain(old)
    expect(css).not.toMatch(/\b(blue|purple|violet|green|cyan|teal)\b/i)
  })

  it('shafts are warm translucent gradients that stay static in layout', () => {
    const shaft = rule('.archive-shaft')
    expect(shaft).toMatch(/background: linear-gradient/)
    for (const h of shaft.match(/#[0-9A-F]{8}/gi)!) expect(parseInt(h.slice(7), 16) / 255).toBeLessThanOrEqual(0.35)
    expect(shaft).toMatch(/mix-blend-mode: screen/)
    expect(shaft).toMatch(/rotate: calc\(16deg/)
  })

  it('every keyframe changes only transform/opacity, rests equally at 0% and 100%, rotates at most 4deg', () => {
    expect(keyframes.map((k) => k.name).sort()).toEqual(['archive-breathe', 'archive-drift-far', 'archive-drift-near', 'archive-float'])
    for (const k of keyframes) {
      const frames = [...k.body.matchAll(/([\d.%,\s]+){([^}]*)}/g)].map((m) => ({ keys: m[1].replace(/\s/g, ''), body: m[2].trim() }))
      expect(frames.find((f) => f.keys === '0%,100%')).toBeTruthy()
      for (const f of frames) {
        for (const p of [...f.body.matchAll(/([\w-]+):/g)].map((m) => m[1])) expect(['transform', 'opacity']).toContain(p)
        for (const d of f.body.matchAll(/rotate\((-?[\d.]+)deg\)/g)) expect(Math.abs(parseFloat(d[1]))).toBeLessThanOrEqual(4)
      }
    }
    const breathe = keyframes.find((k) => k.name === 'archive-breathe')!.body
    const ops = [...breathe.matchAll(/opacity: ([\d.]+)/g)].map((m) => +m[1])
    expect(Math.max(...ops) - Math.min(...ops)).toBeLessThanOrEqual(0.25)
    expect(css).not.toMatch(/animation[^;]*(filter|box-shadow|background-position)/)
  })

  it('motion durations: motes 12-40s, shafts 8-20s, near/far parallax 60-120s, all ease-in-out or linear, infinite', () => {
    const anim = (sel: string) => [...rule(sel).matchAll(/animation: ([\w-]+) ([\d.]+m?s) ([\w-]+)(?: (-[\d.]+s))? infinite/g)]
    const near = anim('.archive-shelves-near')
    const far = anim('.archive-shelves-far')
    for (const [, name, d, ease] of [...near, ...far]) {
      expect(keyframes.map((k) => k.name)).toContain(name)
      expect(seconds(d)).toBeGreaterThanOrEqual(60)
      expect(seconds(d)).toBeLessThanOrEqual(120)
      expect(ease).toBe('ease-in-out')
    }
    expect(near).toHaveLength(1)
    expect(far).toHaveLength(1)
    const shafts = [1, 2, 3].flatMap((n) => anim(`.archive-shaft:nth-child(${n})`))
    expect(shafts).toHaveLength(3)
    for (const [, , d, ease, delay] of shafts) {
      expect(seconds(d)).toBeGreaterThanOrEqual(8)
      expect(seconds(d)).toBeLessThanOrEqual(20)
      expect(ease).toBe('ease-in-out')
      if (delay) expect(parseFloat(delay)).toBeLessThan(0)
    }
    const mote = rule('.archive-mote')
    expect(mote).toMatch(/animation: archive-float [\d.]+s linear infinite/)
    const durs = [...css.matchAll(/\.archive-mote:nth-child\([^)]*\)\s*{[^}]*animation-duration: ([\d.]+)s/g)].map((m) => +m[1])
    expect(durs.length).toBeGreaterThan(1)
    for (const d of [...durs, +/archive-float ([\d.]+)s/.exec(mote)![1]]) {
      expect(d).toBeGreaterThanOrEqual(12)
      expect(d).toBeLessThanOrEqual(40)
    }
    const delays = [...css.matchAll(/\.archive-mote:nth-child\([^)]*\)\s*{[^}]*animation-delay: (-?[\d.]+)s/g)].map((m) => +m[1])
    expect(new Set(delays).size).toBeGreaterThan(2)
    for (const d of delays) expect(d).toBeLessThan(0)
  })

  it('motes are tiny warm specks; parallax layers are wider than their drift; blur only on the far layer', () => {
    const mote = rule('.archive-mote')
    expect(+/opacity: ([\d.]+)/.exec(mote)![1]).toBeGreaterThanOrEqual(0.2)
    const sizes = [...css.matchAll(/\.archive-mote[^{]*{[^}]*width: (\d+)px/g)].map((m) => +m[1])
    for (const s of sizes) expect(s).toBeLessThanOrEqual(4)
    const mop = keyframes.find((k) => k.name === 'archive-float')!.body.match(/opacity: ([\d.]+)/g)!.map((o) => +o.split(': ')[1])
    expect(Math.min(...mop)).toBeGreaterThanOrEqual(0.2)
    expect(Math.max(...mop)).toBeLessThanOrEqual(0.7)
    const layers = rule('.archive-shelves-far,\n.archive-shelves-near')
    expect(layers).toContain('width: calc(100% + 2 * var(--drift))')
    expect(parseFloat(/--drift: ([\d.]+)vw/.exec(layers)![1])).toBeLessThanOrEqual(2.5)
    expect(parseFloat(/--drift: ([\d.]+)vw/.exec(rule('.archive-shelves-far'))![1])).toBeLessThan(2.5)
    expect(rule('.archive-shelves-far')).toMatch(/filter: blur\((\d)px\)/)
    expect(parseFloat(/filter: blur\(([\d.]+)px\)/.exec(rule('.archive-shelves-far'))![1])).toBeLessThanOrEqual(8)
    expect([...bare.matchAll(/([^{}]+){([^}]*filter:[^}]*)}/g)].map((m) => m[1].trim())).toEqual(['.archive-shelves-far'])
  })

  it('vignette darkens the edges; scrim is a centred reading panel keeping --ink/--ink-2/--muted at 4.5:1', () => {
    const v = rule('.archive-vignette')
    expect(v).toMatch(/radial-gradient/)
    const alphas = [...v.matchAll(/#[0-9A-F]{6}([0-9A-F]{2})/gi)].map((m) => parseInt(m[1], 16) / 255)
    expect(Math.max(...alphas)).toBeLessThanOrEqual(0.75)
    expect(alphas[0]).toBeLessThanOrEqual(0.25)
    const s = rule('.archive-scrim')
    for (const d of ['inset-inline: 0', 'margin-inline: auto', 'width: min(calc(var(--max) + 3rem), 100%)', 'inset-block: 0']) expect(s).toContain(d)
    const bg = /background: (#[0-9A-F]{6})([0-9A-F]{2})/i.exec(s)!
    const a = parseInt(bg[2], 16) / 255
    expect(a).toBeGreaterThanOrEqual(0.98)
    const dark = rgb('#1A120B') // darkest scene colour under the scrim
    const blended = rgb(bg[1]).map((c, i) => c * a + dark[i] * (1 - a))
    for (const ink of ['#171717', '#3A3A3A', '#737373']) expect(ratio(rgb(ink), blended)).toBeGreaterThanOrEqual(4.5)
  })

  it('stops every animation under prefers-reduced-motion without hiding anything', () => {
    const block = media('(prefers-reduced-motion: reduce)')
    expect(block).toMatch(/\.archive-bg \*[^{]*{\s*animation: none/)
    expect(block).not.toMatch(/display|visibility|opacity/)
    for (const s of block.matchAll(/([^{}]+){/g)) expect(s[1]).toMatch(/\.archive-/)
  })

  it('pauses every animation while archive-paused', () => {
    expect(css).toMatch(/\.archive-paused,\s*\.archive-paused \*\s*{\s*animation-play-state: paused/)
  })

  it('narrow viewports: at most 8 motes, no far shelves, one shaft, halved drift, full-width scrim', () => {
    const block = media('(max-width: 640px)')
    expect(block).toMatch(/\.archive-mote:nth-child\(n \+ 9\)\s*{\s*display: none/)
    expect(block).toMatch(/\.archive-shelves-far\s*{\s*display: none/)
    expect(block).toMatch(/\.archive-shaft:nth-child\(n \+ 2\)\s*{\s*display: none/)
    expect(block).toMatch(/\.archive-shelves-near\s*{\s*--drift: 1\.25vw/)
    expect(block).toMatch(/\.archive-scrim\s*{\s*width: 100%/)
  })
})
