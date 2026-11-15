import { describe, expect, it } from 'vitest'
import { createReveal, envelope } from './reveal'

const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Steps the scheduler by `dt` and records each reveal's start and end times. */
function run(seed: number, count: number, dt = 0.05) {
  const r = createReveal(seeded(seed))
  const reveals: { start: number; end: number; side: number }[] = []
  let now = 0
  let open: { start: number; side: number } | null = null
  while (reveals.length < count) {
    now += dt
    const s = r.advance(dt)
    if (s.value > 0 && !open) open = { start: now, side: s.side }
    if (s.value === 0 && open) {
      reveals.push({ ...open, end: now })
      open = null
    }
  }
  return reveals
}

describe('reveal scheduler', () => {
  const reveals = run(7, 200)

  it('gaps (first one included) are within 10-20 s over 200 draws and not constant', () => {
    const gaps = reveals.map((r, i) => r.start - (i ? reveals[i - 1].end : 0))
    for (const g of gaps) expect(g >= 10 - 0.2 && g <= 20 + 0.2).toBe(true)
    expect(new Set(gaps.map((g) => g.toFixed(1))).size).toBeGreaterThan(20)
    expect(Math.min(...gaps)).toBeLessThan(12)
    expect(Math.max(...gaps)).toBeGreaterThan(18)
  })

  it('durations are within 3-5 s', () => {
    for (const r of reveals) expect(r.end - r.start >= 3 - 0.3 && r.end - r.start <= 5 + 0.1).toBe(true)
  })

  it('picks both sides', () => {
    expect(new Set(reveals.map((r) => r.side))).toEqual(new Set([-1, 1]))
  })

  it('is exactly 0 outside a reveal and reaches exactly 1 at the plateau', () => {
    const r = createReveal(() => 0) // gap 10 s, duration 3 s
    expect(r.advance(9.9).value).toBe(0)
    let peak = 0
    for (let i = 0; i < 40; i++) peak = Math.max(peak, r.advance(0.1).value)
    expect(peak).toBe(1)
    expect(r.advance(5).value).toBe(0)
  })

  it('envelope is smooth: 0 at both ends, no step, bounded slope', () => {
    expect(envelope(0)).toBe(0)
    expect(envelope(1)).toBe(0)
    expect(envelope(0.5)).toBe(1)
    let prev = 0
    for (let i = 1; i <= 1000; i++) {
      const v = envelope(i / 1000)
      expect(Math.abs(v - prev)).toBeLessThan(0.02)
      prev = v
    }
    expect(envelope(0.001)).toBeLessThan(1e-5) // zero slope at the start
  })

  it('does not advance when no time is passed (paused time excluded)', () => {
    const a = createReveal(seeded(3))
    const b = createReveal(seeded(3))
    a.advance(8)
    for (let i = 0; i < 1000; i++) a.advance(0) // hidden frames contribute nothing
    expect(a.advance(5)).toEqual(b.advance(13))
  })

  it('handles one huge step across several reveals without looping forever', () => {
    expect(createReveal(seeded(1)).advance(1000).value).toBeGreaterThanOrEqual(0)
  })
})
