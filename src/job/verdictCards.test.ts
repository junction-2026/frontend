import { describe, expect, it } from 'vitest'
import type { Job } from '../api/types'
import { translate } from '../i18n/translate'
import { job, run } from './fixtures'
import { cardsOf, evidencePassages, factChecks, topTechnique } from './verdictCards'

const CONTENT = 'Everyone knows these people are destroying our future. They lie.'
const span = (name: string, text: string, field?: string) => {
  const start = CONTENT.indexOf(text)
  return { technique: name, text, start, end: start + text.length, ...(field ? { field } : {}) }
}
const det = (name: string, extra: Record<string, unknown> = {}) => ({ name, display: name, ...extra })
const withRuns = (...analyzers: unknown[]) => job({ input: { content: CONTENT }, analyzers }) as unknown as Job
const tech = (detected: unknown[], status = 'succeeded') => run('techniques', status, { result: { detected } })
const llm = (findings: unknown[], status = 'succeeded') => run('llm_techniques', status, { result: { findings } })
const finding = (text: string, field = 'content') => ({ label: 'misleading_headline', name: 'n', definition: 'd', explanation: 'e', span: { ...span('x', text), field } })
const names = (j: Job) => topTechnique(j)?.top?.name

describe('topTechnique', () => {
  it('is omitted when the techniques run is missing, failed or skipped', () => {
    for (const r of [[], [tech([], 'failed')], [tech([], 'skipped')]]) expect(topTechnique(withRuns(...r))).toBeNull()
  })

  it('prefers strong over weak, and does not take the first array element', () => {
    const j = withRuns(tech([det('Weak', { strength: 'weak', margin: 9, spans: [span('Weak', 'lie')] }), det('Strong', { strength: 'strong' })]))
    expect(names(j)).toBe('Strong')
  })

  it('gives a neutral result for weak-only detections and for none', () => {
    expect(topTechnique(withRuns(tech([det('Weak', { strength: 'weak' })])))).toEqual({ top: null })
    expect(topTechnique(withRuns(tech([])))).toEqual({ top: null })
  })

  it('ranks located before not located, then margin, then span count, then name', () => {
    const s = span('A', 'lie')
    expect(names(withRuns(tech([det('A', { strength: 'strong', margin: 5 }), det('B', { strength: 'strong', spans: [s] })])))).toBe('B')
    expect(names(withRuns(tech([det('A', { strength: 'strong', margin: 1, spans: [s] }), det('B', { strength: 'strong', margin: 2, spans: [s] })])))).toBe('B')
    expect(names(withRuns(tech([det('A', { strength: 'strong', margin: 1, spans: [s] }), det('B', { strength: 'strong', margin: 1, spans: [s, span('B', 'Everyone')] })])))).toBe('B')
    expect(names(withRuns(tech([det('B', { strength: 'strong' }), det('A', { strength: 'strong' })])))).toBe('A')
    expect(names(withRuns(tech([det('A', { strength: 'strong', margin: 1 }), det('B', { strength: 'strong' })])))).toBe('A') // missing margin = 0
  })

  it('counts an entry without strength as strong only with a valid span', () => {
    expect(names(withRuns(tech([det('A'), det('B', { spans: [span('B', 'lie')] })])))).toBe('B')
    expect(topTechnique(withRuns(tech([det('A'), det('B', { spans: [{ technique: 'B', text: 'zzz', start: 0, end: 3 }] })])))).toEqual({ top: null })
  })

  it('never ranks LLM findings', () => {
    expect(topTechnique(withRuns(tech([]), llm([finding('lie')])))).toEqual({ top: null })
  })
})

describe('evidencePassages', () => {
  it('is omitted when both runs are missing, failed or skipped', () => {
    expect(evidencePassages(withRuns())).toBeNull()
    expect(evidencePassages(withRuns(tech([], 'failed'), llm([], 'skipped')))).toBeNull()
  })

  it('is zero when a run succeeded without located passages', () => {
    expect(evidencePassages(withRuns(tech([det('A', { strength: 'strong' })])))).toBe(0)
    expect(evidencePassages(withRuns(llm([])))).toBe(0)
  })

  it('counts identical and overlapping ranges across techniques and LLM content spans once', () => {
    const lie = span('A', 'lie')
    const j = withRuns(
      tech([det('A', { spans: [lie, span('A', 'Everyone knows')] }), det('B', { spans: [lie, span('B', 'Everyone')] })]),
      llm([finding('lie'), finding('knows these'), finding('destroying')]),
    )
    // "Everyone knows" ⊇ "Everyone", "knows these" overlaps "Everyone knows"; "lie" twice + llm "lie"; "destroying"
    expect(evidencePassages(j)).toBe(3)
  })

  it('keeps adjacent ranges apart and ignores LLM title spans', () => {
    const a = { technique: 'A', text: 'Everyone', start: 0, end: 8 }
    const b = { technique: 'A', text: ' knows', start: 8, end: 14 }
    expect(evidencePassages(withRuns(tech([det('A', { spans: [a, b] })]), llm([finding('lie', 'title')])))).toBe(2)
  })

  it('drops invalid spans', () => {
    const bad = [{ technique: 'A', text: 'nope', start: 0, end: 4 }, { technique: 'A', text: 'x', start: -1, end: 0 }, { technique: 'A', text: 'x', start: 5, end: 5 }, { technique: 'A', text: 'x', start: 1000, end: 1001 }, 'junk', null]
    expect(evidencePassages(withRuns(tech([det('A', { spans: bad })])))).toBe(0)
  })

  it('works with a succeeded LLM run alone', () => {
    expect(evidencePassages(withRuns(tech([], 'failed'), llm([finding('lie')])))).toBe(1)
  })
})

describe('factChecks', () => {
  const fc = (status: string, result: unknown = null) => run('fact_check', status, { result })
  it('is absent without a run', () => expect(factChecks(withRuns())).toEqual({ kind: 'absent' }))
  it.each([['failed'], ['skipped']])('is unavailable when %s', (s) => expect(factChecks(withRuns(fc(s)))).toEqual({ kind: 'unavailable' }))
  it('is null while unsettled', () => expect(factChecks(withRuns(fc('running')))).toBeNull())
  it('counts none and n matches', () => {
    expect(factChecks(withRuns(fc('succeeded', { fact_checks: [] })))).toEqual({ kind: 'count', n: 0 })
    expect(factChecks(withRuns(fc('succeeded', { fact_checks: [{}, {}, {}] })))).toEqual({ kind: 'count', n: 3 })
    expect(factChecks(withRuns(fc('succeeded', {})))).toEqual({ kind: 'count', n: 0 })
  })
})

describe('cardsOf', () => {
  const t = (k: string, p?: Record<string, string | number>) => translate('en', k, p)
  const cards = (j: Job, v: 'detected' | 'uncertain' = 'detected') => cardsOf(j, v, 'en', t, String)
  const fc = (status: string, result: unknown = null) => run('fact_check', status, { result })
  const s = span('A', 'lie')

  it('shows technique, evidence and fact-check values', () => {
    const c = cards(withRuns(tech([det('A', { strength: 'strong', display: 'Loaded Language', spans: [s] })]), fc('succeeded', { fact_checks: [{}, {}] })))
    expect(c.map((x) => [x.label, x.value, x.status])).toEqual([
      ['Top technique', 'Loaded Language', 'Detected'],
      ['Evidence', '1 passage', 'Located'],
      ['Fact-checks', '2 matches', 'Related checks found'],
    ])
  })

  it('says "Signal, not conclusive" unless the verdict is detected', () => {
    expect(cards(withRuns(tech([det('A', { strength: 'strong' })])), 'uncertain')[0].status).toBe('Signal, not conclusive')
  })

  it('shows neutral values for none, no matches and unavailable', () => {
    const c = cards(withRuns(tech([det('A', { strength: 'weak' })]), fc('succeeded', { fact_checks: [] })))
    expect(c.map((x) => [x.value, x.neutral])).toEqual([['No strong technique', true], ['No located passages', true], ['No matches', true]])
    const u = cards(withRuns(tech([]), fc('failed')))
    expect(u[2]).toMatchObject({ value: 'Unavailable', neutral: true })
    expect(u[2].status).toBeUndefined()
  })

  it('replaces the fact-check card by the strong technique count when there is no fact_check run', () => {
    const c = cards(withRuns(tech([det('A', { strength: 'strong' }), det('B', { strength: 'strong' }), det('C', { strength: 'weak' })])))
    expect(c[2]).toMatchObject({ label: 'Techniques', value: '2 techniques', status: 'Supported' })
    expect(cards(withRuns(tech([], 'failed')))).toEqual([])
    expect(cards(withRuns())).toEqual([])
  })

  it('never claims a fact-check confirms the verdict', () => {
    expect(JSON.stringify(cards(withRuns(tech([]), fc('succeeded', { fact_checks: [{}] }))))).not.toMatch(/confirm|consensus|%/i)
  })
})
