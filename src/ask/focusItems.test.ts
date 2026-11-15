import { describe, expect, it } from 'vitest'
import type { Job } from '../api/types'
import { translate } from '../i18n/translate'
import { finalization, risk, run } from '../job/fixtures'
import { richJob } from './askFixtures'
import { focusItemsOf, shorten } from './focusItems'

const t = (key: string, params?: Record<string, string | number>) => translate('en', key, params)
const pairs = (j: Job) => focusItemsOf(j, 'en', t).map((i) => `${i.kind}/${i.ref}`)

describe('focusItemsOf', () => {
  it('lists the elements in panel order with the shared kinds and refs', () => {
    expect(pairs(richJob())).toEqual([
      'final_assessment/final_assessment',
      'technique/Loaded_Language', 'passage/0:14:Loaded_Language', 'passage/32:42:Loaded_Language', 'technique/Doubt',
      'llm_finding/0',
      'risk_dimension/intensity', 'risk_dimension/confirmation', 'risk_dimension/amplification',
      'risk_driver/0', 'risk_driver/1',
      'risk_caveat/content_not_reader', 'risk_caveat/bot_not_intent',
      'wikipedia_claim/0',
      'term_context/0',
    ])
  })

  it('builds labels from the text the result view shows', () => {
    const labels = Object.fromEntries(focusItemsOf(richJob(), 'en', t).map((i) => [`${i.kind}/${i.ref}`, i.label]))
    expect(labels['final_assessment/final_assessment']).toBe('Manipulation detected')
    expect(labels['technique/Loaded_Language']).toBe('Loaded language')
    expect(labels['passage/0:14:Loaded_Language']).toBe('Everyone knows')
    expect(labels['llm_finding/0']).toBe('Misleading headline')
    expect(labels['risk_dimension/intensity']).toBe(t('results.risk.dim.intensity'))
    expect(labels['risk_caveat/bot_not_intent']).toBe(t('results.risk.caveat.bot_not_intent'))
    expect(labels['wikipedia_claim/0']).toBe('People are destroying our future')
    expect(labels['term_context/0']).toBe('future')
  })

  it('uses the localized technique name for another UI language', () => {
    const de = focusItemsOf(richJob(), 'de', (k, p) => translate('de', k, p)).find((i) => i.ref === 'Doubt')
    expect(de?.label).toBe(translate('de', 'techniques.Doubt.name'))
  })

  it('lists only what the job has', () => {
    expect(pairs(richJob({ analyzers: [], risk: null }))).toEqual(['final_assessment/final_assessment'])
    expect(pairs(richJob({ finalization: finalization('failed') }))).not.toContain('final_assessment/final_assessment')
  })

  it('lists nothing for a job that is not completed', () => {
    expect(pairs(richJob({ status: 'running', done: false }))).toEqual([])
  })

  it('skips unavailable dimensions and the drivers of an unscored risk', () => {
    const r = risk({ status: 'unavailable', band: null, score: null, dimensions: { intensity: { available: false, score: null }, confirmation: { available: true, score: 0.5 }, amplification: { available: false, score: null } } })
    const p = pairs(richJob({ risk: r }))
    expect(p.filter((x) => x.startsWith('risk_dimension'))).toEqual(['risk_dimension/confirmation'])
    expect(p.some((x) => x.startsWith('risk_driver'))).toBe(false)
  })

  it('indexes the raw arrays, not the filtered ones', () => {
    const j = richJob({
      analyzers: [
        run('wikipedia', 'succeeded', { result: { claims: ['junk', { claim: 'Second' }] } }),
        run('term_context', 'succeeded', { result: { terms: [{ term: '' }, { term: 'kept' }] } }),
      ],
      risk: risk({ drivers: [null, { kind: 'amplification', text: 'x' }], caveats: [{ id: 'a', text: 'A' }, { id: 'a', text: 'again' }] }),
    })
    const p = pairs(j)
    expect(p).toContain('wikipedia_claim/1')
    expect(p).toContain('term_context/1')
    expect(p).toContain('risk_driver/1')
    expect(p.filter((x) => x === 'risk_caveat/a')).toHaveLength(1) // the first caveat with that id
  })

  it('shortens to 120 code points for display and 500 for the request', () => {
    const long = `${'😀'.repeat(300)}`
    const j = richJob({ input: { content: long }, analyzers: [run('techniques', 'succeeded', { result: { detected: [{ name: 'X', display: 'X', explanation: '', spans: [{ technique: 'X', text: long, start: 0, end: long.length }] }] } })] })
    const p = focusItemsOf(j, 'en', t).find((i) => i.kind === 'passage')!
    expect(Array.from(p.shown)).toHaveLength(120)
    expect(p.shown.endsWith('…')).toBe(true)
    expect(Array.from(p.label)).toHaveLength(300)
    const huge = '😀'.repeat(900)
    expect(Array.from(shorten(huge, 500))).toHaveLength(500)
  })
})

describe('shorten', () => {
  it('collapses whitespace and keeps short text', () => {
    expect(shorten('  a \n\t b ', 120)).toBe('a b')
    expect(shorten('abcdef', 6)).toBe('abcdef')
    expect(shorten('abcdefg', 6)).toBe('abcde…')
  })
})
