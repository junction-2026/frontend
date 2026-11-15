import { describe, expect, it } from 'vitest'
import { ALPHA, BASE, EDGE, FOLDS, FRAGMENT, SHADOW, SWAY, VERTEX, WAVES } from './shader'

describe('silk shader', () => {
  it('has one fragment shader with the uniforms the renderer sets', () => {
    for (const u of ['u_res', 'u_time', 'u_reveal', 'u_side']) expect(FRAGMENT).toMatch(new RegExp(`uniform \\w+ ${u};`))
    expect(VERTEX).toContain('a_pos')
    expect(FRAGMENT).toContain('gl_FragColor')
    expect(FRAGMENT).not.toMatch(/\bfract\(|\bmod\(/) // no tile, stripe or loop restart
  })

  it('has 3+ fold frequencies and 2+ travelling octaves, all inside the speed limits', () => {
    expect(FOLDS.length).toBeGreaterThanOrEqual(3)
    expect(new Set(FOLDS).size).toBe(FOLDS.length)
    expect(WAVES.length).toBeGreaterThanOrEqual(2)
    for (const w of WAVES) expect(w.speed).toBeLessThanOrEqual(0.15)
    expect(SWAY.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(0.03)
    for (const w of WAVES) expect(FRAGMENT).toContain(`${(2 * Math.PI * w.freq * w.speed).toFixed(5)} * u_time`)
  })

  it('derives lighting from normals: diffuse plus a low specular', () => {
    expect(FRAGMENT).toMatch(/normalize\(vec3\(/)
    expect(FRAGMENT).toMatch(/pow\(max\(dot\(reflect/)
  })

  it('alpha is 0.35-0.75 and composited channels stay >= 0xD0 over white', () => {
    expect(ALPHA.min).toBeGreaterThanOrEqual(0.35)
    expect(ALPHA.max).toBeLessThanOrEqual(0.75)
    for (const c of [...BASE, ...SHADOW]) {
      const out = c * ALPHA.max + (1 - ALPHA.max)
      expect(out * 255).toBeGreaterThanOrEqual(0xd0)
    }
    // neutral: no channel strays far from the others (no hue pattern)
    for (const c of [BASE, SHADOW]) expect(Math.max(...c) - Math.min(...c)).toBeLessThan(0.05)
  })

  it('a reveal clears at least 40% of the viewport and nothing at rest', () => {
    expect(EDGE.reach - EDGE.curve - EDGE.soft).toBeGreaterThanOrEqual(0.4)
    expect(FRAGMENT).toContain('u_reveal *') // edge = 0 at u_reveal = 0
  })
})
