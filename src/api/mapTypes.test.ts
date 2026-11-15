import { describe, expect, it } from 'vitest'
import { readAnalyses } from './mapTypes'

const base = { job_id: 'j1', created_at: '2026-11-10T10:00:00Z', country_code: 'RU', country: 'Russia', snippet: 's', techniques: [], verdict: null }

describe('readAnalyses countries', () => {
  it('reads MapCountry entries, ignores unknown basis values and drops invalid entries', () => {
    const [a] = readAnalyses({ items: [{ ...base, outlet: null, source: { url: '', title: null }, countries: [
      { country_code: 'ru', country: 'Russia', basis: ['outlet', 'future', 3] },
      { country_code: 'UA', country: 'Ukraine', basis: ['content'], extra: 1 },
      { country: 'No code', basis: ['content'] },
      'junk', null,
    ] }], next_cursor: null }).items
    expect(a.countries).toEqual([
      { country_code: 'RU', country: 'Russia', basis: ['outlet'] },
      { country_code: 'UA', country: 'Ukraine', basis: ['content'] },
    ])
  })

  it('keeps outlet null and source.url "" for a pasted-text item, and tolerates missing countries', () => {
    const [a] = readAnalyses({ items: [{ ...base, outlet: null, source: { url: '', title: null } }] }).items
    expect(a.outlet).toBeNull()
    expect(a.source).toEqual({ url: '', title: null })
    expect(a.countries).toEqual([])
    expect(readAnalyses({ items: [{ ...base, countries: 'x', outlet: 5, source: 7 }] }).items[0]).toMatchObject({ outlet: null, source: { url: '', title: null }, countries: [] })
  })
})
