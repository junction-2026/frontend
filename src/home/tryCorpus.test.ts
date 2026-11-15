import { describe, expect, it } from 'vitest'
import corpus from '../data/try-out-statements.json'
import { draw, truncate, validItems } from './tryCorpus'

// Deterministic LCG so two seeds give two sequences.
const seeded = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32)

describe('draw', () => {
  const items = Array.from({ length: 50 }, (_, i) => i)
  it('returns 5 unique items, differs across seeds and does not mutate the input', () => {
    const copy = [...items]
    const a = draw(items, 5, seeded(1))
    const b = draw(items, 5, seeded(2))
    expect(a).toHaveLength(5)
    expect(new Set(a).size).toBe(5)
    expect(a).not.toEqual(b)
    expect(items).toEqual(copy)
  })
  it('can return every item when n equals the length', () => {
    expect(draw([1, 2, 3], 5, seeded(3)).sort()).toEqual([1, 2, 3])
  })
})

describe('validItems', () => {
  it('drops bad items and non-arrays', () => {
    const ok = { statement: 'a', expectation: 'detected' }
    expect(validItems([ok, { statement: '  ', expectation: 'detected' }, { statement: 'b', expectation: 'x' }, { statement: 1, expectation: 'detected' }, null, 'z'])).toEqual([ok])
    expect(validItems({})).toEqual([])
  })
})

describe('committed corpus', () => {
  it('has 1000 valid items with the agreed distribution and keys', () => {
    expect(corpus).toHaveLength(1000)
    expect(validItems(corpus)).toHaveLength(1000)
    expect(corpus.every((x) => Object.keys(x).sort().join() === 'expectation,statement')).toBe(true)
    const n = (e: string) => corpus.filter((x) => x.expectation === e).length
    expect([n('not_detected'), n('uncertain'), n('detected')]).toEqual([581, 233, 186])
  })
})

describe('truncate', () => {
  it('cuts by code points', () => {
    expect(truncate('😀😀😀', 2)).toBe('😀😀…')
    expect(truncate('abc', 3)).toBe('abc')
  })
})
