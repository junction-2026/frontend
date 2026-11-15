import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/noise-headline.css', 'utf8')
const rule = (sel: string) => new RegExp(`(?:^|\\n)\\s*${sel.replace(/[+.:]/g, '\\$&')}\\s*{([^}]*)}`).exec(css)![1]
const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)\s*{((?:[^{}]*{[^}]*})+)\s*}/g)]
const reduced = /@media \(prefers-reduced-motion: reduce\)\s*{([^@]*)}\s*$/.exec(css)![1]

describe('noise-headline.css', () => {
  it('layer is fixed, clipped, click-through, unselectable, centred, at z-index 0', () => {
    const layer = rule('.noise-headline')
    for (const d of ['position: fixed', 'inset: 0', 'overflow: hidden', 'pointer-events: none', 'user-select: none', 'z-index: 0', 'display: flex', 'unicode-bidi: isolate']) expect(layer).toContain(d)
    const op = parseFloat(/opacity: ([\d.]+)/.exec(layer)![1])
    expect(op).toBeGreaterThanOrEqual(0.05)
    expect(op).toBeLessThanOrEqual(0.12)
  })

  it('lettering is black, heavy, tall and not transformed in case', () => {
    const t = rule('.noise-headline-text')
    expect(t).toContain('color: #000')
    expect(t).toContain('font-family: var(--font)')
    expect(t).toContain('font-size: clamp(64px, 15vw, 240px)')
    expect(t).not.toContain('text-transform')
    expect(parseInt(/font-weight: (\d+)/.exec(t)![1])).toBeGreaterThanOrEqual(800)
    expect(parseFloat(/line-height: ([\d.]+)/.exec(t)![1])).toBeLessThanOrEqual(1)
    const s = parseFloat(/scaleY\(([\d.]+)\)/.exec(t)![1])
    expect(s).toBeGreaterThanOrEqual(1.5)
    expect(s).toBeLessThanOrEqual(2.2)
  })

  it('opacity, filter and mask appear only on .noise-headline* selectors', () => {
    const plain = css.replace(/@keyframes[^{]*{(?:[^{}]*{[^}]*})+\s*}/g, '')
    for (const m of plain.matchAll(/(?:^|\n)\s*([^{}@\n][^{}]*){([^}]*)}/g)) {
      if (/(?:^|[^-])(opacity|filter|mask-image)\s*:/.test(m[2])) expect(m[1].trim()).toMatch(/^\.noise-headline/)
    }
  })

  it('both pseudo-elements are offset, banded shards of data-text', () => {
    for (const p of ['::before', '::after']) {
      const r = new RegExp(`\\.noise-headline-text${p}\\s*{([^}]*)}`, 'g')
      const body = [...css.matchAll(r)].map((m) => m[1]).join('\n')
      expect(css).toMatch(/\.noise-headline-text::before,\s*\.noise-headline-text::after\s*{[^}]*position: absolute/)
      expect(body).toMatch(/clip-path: inset\(/)
      const dx = Math.abs(parseInt(/translateX\((-?\d+)px\)/.exec(body)![1]))
      expect(dx).toBeGreaterThanOrEqual(2)
      expect(dx).toBeLessThanOrEqual(12)
    }
    expect(css).toContain('content: attr(data-text)')
    expect(rule('.noise-headline-text::before')).toContain('translateX(-')
    expect(rule('.noise-headline-text::after')).not.toContain('translateX(-')
  })

  it('text has a scanline + fade mask reaching alpha 0', () => {
    const t = rule('.noise-headline-text')
    expect(t).toMatch(/-webkit-mask-image:[^;]*repeating-linear-gradient[^;]*linear-gradient[^;]*transparent/)
    expect(t).toMatch(/(?<!-webkit-)mask-image:[^;]*repeating-linear-gradient/)
  })

  it('keyframes: <=3, noise-* names, only clip-path/transform/opacity, equal ends, 4-12s steps', () => {
    expect(keyframes.length).toBeGreaterThan(0)
    expect(keyframes.length).toBeLessThanOrEqual(3)
    for (const [, name, body] of keyframes) {
      expect(name).toMatch(/^noise-/)
      const props = new Set([...body.matchAll(/([\w-]+)\s*:/g)].map((m) => m[1]))
      for (const p of props) expect(['clip-path', 'transform', 'opacity']).toContain(p)
      const frames = [...body.matchAll(/([\d.%,\s]+){([^}]*)}/g)].map((m) => [m[1].replace(/\s/g, '').split(','), m[2].trim()] as const)
      const first = frames.find(([k]) => k.includes('0%'))![1]
      const last = frames.find(([k]) => k.includes('100%'))![1]
      expect(last).toBe(first)
    }
    const anims = [...css.matchAll(/animation:\s*(noise-[\w-]+)\s+([\d.]+)s\s+steps\([^)]*\)\s+infinite/g)]
    expect(anims.length).toBe(3)
    for (const a of anims) {
      expect(parseFloat(a[2])).toBeGreaterThanOrEqual(4)
      expect(parseFloat(a[2])).toBeLessThanOrEqual(12)
    }
    expect(css).not.toMatch(/blur\(/)
    expect(css).not.toContain('requestAnimationFrame')
  })

  it('glitch is active for at most ~20% of the cycle', () => {
    for (const [, , body] of keyframes) {
      const last = Math.max(...[...body.matchAll(/(?:^|[\n,])\s*(\d+)%/g)].map((m) => +m[1]).filter((n) => n < 100))
      expect(last).toBeLessThanOrEqual(20)
    }
  })

  it('reduced motion only stops animation', () => {
    for (const s of ['.noise-headline-text,', '.noise-headline-text::before,', '.noise-headline-text::after']) expect(reduced).toContain(s)
    expect(reduced).toContain('animation: none')
    expect(reduced).not.toMatch(/opacity|display|visibility/)
  })
})
