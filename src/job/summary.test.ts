import { describe, expect, it, vi } from 'vitest'
import { summaryOf } from './summary'

const FALL = 'Fixed sentence.'
const one = 'This text pressures the reader.'

describe('summaryOf', () => {
  it('takes the first sentence', () => expect(summaryOf(`${one} It repeats a slogan.`, 'en', FALL)).toBe(one))
  it('trims the text and the sentence', () => expect(summaryOf(`  \n${one}  Second one here.`, 'en', FALL)).toBe(one))
  it('keeps a single sentence without a split', () => expect(summaryOf(one, 'en', FALL)).toBe(one))
  it('uses the fixed sentence when the first sentence is too short', () => expect(summaryOf('Too short. And then a long enough second sentence follows.', 'en', FALL)).toBe(FALL))
  it('uses the fixed sentence when the first sentence is too long, never cutting it', () => {
    const long = `${'word '.repeat(60)}end.`
    expect(summaryOf(`${long} Next.`, 'en', FALL)).toBe(FALL)
  })
  it('accepts exactly 20 and 220 code points and refuses 19 and 221', () => {
    expect(summaryOf(`${'a'.repeat(19)}.`, 'en', FALL)).toBe(`${'a'.repeat(19)}.`)
    expect(summaryOf(`${'a'.repeat(18)}.`, 'en', FALL)).toBe(FALL)
    expect(summaryOf(`${'a'.repeat(219)}. X`, 'en', FALL)).toBe(`${'a'.repeat(219)}.`)
    expect(summaryOf(`${'a'.repeat(220)}. X`, 'en', FALL)).toBe(FALL)
  })
  it('counts code points, not UTF-16 units', () => expect(summaryOf(`${'😀'.repeat(19)}.`, 'en', FALL)).toBe(`${'😀'.repeat(19)}.`))
  it('uses the whole text when it has no terminator, or the fixed sentence when that is too long', () => {
    expect(summaryOf('No terminator but long enough to read', 'en', FALL)).toBe('No terminator but long enough to read')
    expect(summaryOf('x'.repeat(300), 'en', FALL)).toBe(FALL)
  })
  it('uses the fixed sentence for an empty text', () => expect(summaryOf('  ', 'en', FALL)).toBe(FALL))
  it('splits after the Arabic question mark', () => {
    const q = 'هل هذا النص يضغط على القارئ؟'
    expect(summaryOf(`${q} نعم، يفعل ذلك.`, 'ar', FALL)).toBe(q)
  })

  describe('without Intl.Segmenter', () => {
    const run = (text: string, locale = 'en') => {
      vi.stubGlobal('Intl', { ...Intl, Segmenter: undefined })
      try {
        return summaryOf(text, locale, FALL)
      } finally {
        vi.unstubAllGlobals()
      }
    }
    it.each([['.'], ['!'], ['?'], ['؟'], ['。']])('splits after %s followed by whitespace', (mark) => {
      const first = `This is the first full sentence${mark}`
      expect(run(`${first} And a second one.`)).toBe(first)
    })
    it('does not split inside a number or without following whitespace', () => expect(run('The value is 3.5 percent higher than before. Next.')).toBe('The value is 3.5 percent higher than before.'))
    it('uses the whole text without a terminator', () => expect(run('No terminator but long enough to read')).toBe('No terminator but long enough to read'))
  })
})
