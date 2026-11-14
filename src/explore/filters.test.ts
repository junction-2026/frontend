import { describe, expect, it } from 'vitest'
import type { Job } from '../api/types'
import { readExplore } from './adapter'
import { aggregateByCountry, filterItems, options, publisherCount, topicsOf } from './filters'
import { article, exploreJob, factCheck, query, sourceArticle } from './fixtures'
import { NO_FILTERS } from './model'

const arts = [
  article(1, { language: 'en', query: 'q one', title: 'Grid outage in Helsinki', snippet: 'power' }),
  article(2, { language: 'fi', query: 'q two', language2: 1 }),
  article(3, { language: 'en', query: 'q one', url: 'https://site3.example/b' }),
  article(4, { language: 'de', query: 'q one' }),
  article(5, { language: 'en', query: 'q one' }),
]
const sources = [
  sourceArticle(arts[0], { name: 'A', domain: 'a.fi', country_code: 'FI', country: 'Finland' }),
  sourceArticle(arts[1], { name: 'A2', domain: 'a.fi', country_code: 'FI', country: 'Finland' }),
  sourceArticle(arts[2], { name: 'B', domain: 'b.de', country_code: 'DE', country: '' }),
  sourceArticle(arts[3]),
  sourceArticle(arts[4], { name: 'C', domain: 'c.fi', country_code: 'FI', country: 'Finland' }),
]
const data = readExplore(exploreJob({
  articles: arts, sources, queries: [query('q one', 'Topic one'), query('q two', 'Topic two', { origin: 'news' })], checks: [factCheck()],
}) as unknown as Job)
const f = (p = {}) => ({ ...NO_FILTERS, ...p })

describe('filterItems', () => {
  it('shows only articles, or only fact-checks with verifiedOnly', () => {
    expect(filterItems(data.items, f()).every((i) => i.kind === 'article')).toBe(true)
    expect(filterItems(data.items, f({ verifiedOnly: true })).map((i) => i.kind)).toEqual(['fact_check'])
  })
  it('applies topic, text, language, publisher and country together', () => {
    const n = (p: object) => filterItems(data.items, f(p)).length
    expect(n({})).toBe(5)
    expect(n({ topic: 'Topic two' })).toBe(1)
    expect(n({ text: 'HELSINKI' })).toBe(1)
    expect(n({ text: 'power' })).toBe(1)
    expect(n({ languages: ['en', 'fi'] })).toBe(4)
    expect(n({ publishers: ['a.fi'] })).toBe(2)
    expect(n({ country: 'FI' })).toBe(3)
    expect(n({ country: 'FI', languages: ['en'], publishers: ['a.fi'] })).toBe(1)
    expect(n({ country: 'GB' })).toBe(0)
  })
  it('keeps fact-checks independent of the topic select', () => {
    expect(filterItems(data.items, f({ verifiedOnly: true, topic: 'Topic two' }))).toHaveLength(1)
    expect(filterItems(data.items, f({ verifiedOnly: true, country: 'FI' }))).toHaveLength(0)
  })
})

describe('aggregateByCountry', () => {
  it('counts articles, publishers and languages per verified country with relative levels', () => {
    const a = aggregateByCountry(filterItems(data.items, f()))
    expect(a.FI).toEqual({ name: 'Finland', articles: 3, publishers: 2, languages: ['en', 'fi'], level: 'high' })
    expect(a.DE).toMatchObject({ name: 'Germany', articles: 1, publishers: 1, level: 'low' }) // empty Outlet.country: bundled map name
    expect(Object.keys(a).sort()).toEqual(['DE', 'FI']) // unknown-country article is never mapped
  })
  it('has no entry without items and derives levels from the maximum', () => {
    expect(aggregateByCountry([])).toEqual({})
    const mk = (cc: string, n: number) => Array.from({ length: n }, (_, k) => ({ ...data.items[0], id: `${cc}${k}`, countryCode: cc, countryName: null }))
    const a = aggregateByCountry([...mk('FR', 9), ...mk('ES', 5), ...mk('IT', 3), ...mk('PT', 2)])
    expect([a.FR.level, a.ES.level, a.IT.level, a.PT.level]).toEqual(['high', 'medium', 'low', 'low'])
  })
  it('gives the same counts to every consumer of one filtered dataset', () => {
    const shown = filterItems(data.items, f({ languages: ['en'] }))
    const a = aggregateByCountry(shown)
    expect(Object.values(a).reduce((n, c) => n + c.articles, 0) + shown.filter((i) => !i.countryCode).length).toBe(shown.length)
    expect(publisherCount(shown.filter((i) => i.countryCode))).toBe(Object.values(a).reduce((n, c) => n + c.publishers, 0))
  })
})

describe('options and topics', () => {
  it('lists present values with counts, most frequent first', () => {
    expect(options(data.items.filter((i) => i.kind === 'article'), 'language')).toEqual([
      { value: 'en', label: 'EN', count: 3 }, { value: 'de', label: 'DE', count: 1 }, { value: 'fi', label: 'FI', count: 1 },
    ])
    expect(options(data.items.filter((i) => i.kind === 'article'), 'publisher')[0]).toEqual({ value: 'a.fi', label: 'A', count: 2 })
    expect(options([], 'language')).toEqual([])
  })
  it('lists distinct originals with topic origin first', () => {
    expect(topicsOf([query('1', 'N', { origin: 'news' }), query('2', 'T'), query('3', 'T', { language: 'de' })])).toEqual(['T', 'N'])
  })
})
