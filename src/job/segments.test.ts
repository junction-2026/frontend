import { describe, expect, it } from 'vitest'
import { segment, validSpans } from './segments'

const sp = (technique: string, content: string, start: number, end: number) => ({
  technique,
  text: content.slice(start, end),
  start,
  end,
})

describe('segment', () => {
  it('splits at every boundary, represents overlaps and concatenates to content', () => {
    const c = 'abcdefghij'
    const out = segment(c, [sp('A', c, 2, 6), sp('B', c, 4, 8)])
    expect(out).toEqual([
      { text: 'ab', techniques: [] },
      { text: 'cd', techniques: ['A'] },
      { text: 'ef', techniques: ['A', 'B'] },
      { text: 'gh', techniques: ['B'] },
      { text: 'ij', techniques: [] },
    ])
    expect(out.map((s) => s.text).join('')).toBe(c)
  })

  it('returns one plain segment without spans and none for empty content', () => {
    expect(segment('hi', [])).toEqual([{ text: 'hi', techniques: [] }])
    expect(segment('', [])).toEqual([])
  })
})

describe('validSpans', () => {
  const c = 'Ünï LYING'
  it('drops out-of-range, mismatching, non-integer and malformed spans', () => {
    const good = sp('A', c, 4, 9)
    const bad = [
      { ...good, text: 'lying' },
      { ...good, end: 99, text: 'x' },
      { ...good, start: -1 },
      { ...good, start: 5, end: 5, text: '' },
      { ...good, start: 4.5 },
      { ...good, start: '4' },
      null,
      'x',
    ]
    expect(validSpans(c, [...bad, good])).toEqual([good])
    expect(validSpans(c, undefined)).toEqual([])
  })
})
