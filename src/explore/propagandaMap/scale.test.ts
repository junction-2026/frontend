import { describe, expect, it } from 'vitest'
import { NONE_FILL, STEP_COLORS, makeScale } from './scale'

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('propaganda map scale', () => {
  it('is monotonic, starts at step 0 and gives the maximum the last step', () => {
    for (const max of [1, 2, 3, 5, 6, 7, 10, 37, 100, 999, 5000]) {
      const { stepOf } = makeScale(max)
      let prev = -1
      for (let c = 1; c <= max; c++) {
        const s = stepOf(c)!
        expect(s).toBeGreaterThanOrEqual(prev)
        expect(s).toBeLessThan(STEP_COLORS.length)
        prev = s
      }
      expect(stepOf(1)).toBe(0)
      expect(stepOf(max)).toBe(max >= 5 ? 4 : max - 1)
    }
  })

  it('has no step for zero or absent counts', () => {
    expect(makeScale(10).stepOf(0)).toBeNull()
    expect(makeScale(10).stepOf(NaN)).toBeNull()
  })

  it('uses one step per count up to five and log buckets above', () => {
    expect(makeScale(3).ranges).toEqual([{ step: 0, from: 1, to: 1 }, { step: 1, from: 2, to: 2 }, { step: 2, from: 3, to: 3 }])
    const r = makeScale(100).ranges
    expect(r).toHaveLength(5)
    expect(r[0].from).toBe(1)
    expect(r[4].to).toBe(100)
    r.slice(1).forEach((x, i) => expect(x.from).toBe(r[i].to + 1)) // contiguous, no gaps or overlaps
  })

  it('legend colours keep 3:1 contrast between first and last step and against the map background', () => {
    expect(contrast(STEP_COLORS[0], STEP_COLORS[4])).toBeGreaterThanOrEqual(3)
    expect(contrast(STEP_COLORS[4], '#F5F9FE')).toBeGreaterThanOrEqual(3)
    expect(STEP_COLORS.map(lum)).toEqual([...STEP_COLORS.map(lum)].sort((a, b) => b - a)) // darker with each step
    expect(contrast(STEP_COLORS[0], NONE_FILL)).toBeGreaterThan(1.2)
  })
})
