import { describe, expect, it } from 'vitest'
import type { Job } from '../api/types'
import { run } from '../job/fixtures'
import { canonicalUrl, readExplore } from './adapter'
import { article, exploreJob, factCheck, query, sourceArticle } from './fixtures'

const read = (o: Parameters<typeof exploreJob>[0]) => readExplore(exploreJob(o) as unknown as Job)

describe('canonicalUrl', () => {
  it.each([
    ['https://www.Example.COM/a#top', 'https://example.com/a'],
    ['HTTPS://WWW.EXAMPLE.COM/a/', 'https://example.com/a'],
    ['https://example.com/', 'https://example.com/'],
    ['https://example.com/a?x=1#f', 'https://example.com/a?x=1'],
    ['https://www.www.example.com/', 'https://www.example.com/'],
  ])('%s', (raw, want) => expect(canonicalUrl(raw)).toBe(want))
  it.each(['javascript:alert(1)', 'ftp://x.example/a', 'not a url', '', null, 5])('rejects %s', (raw) => expect(canonicalUrl(raw)).toBeNull())
})

describe('readExplore articles', () => {
  it('turns valid articles into items with null optional fields, dropping invalid ones', () => {
    const d = read({
      articles: [article(1, { source: 'Wire', date: '3 hours ago', snippet: 'S' }), { title: '', url: 'https://a.example/x' }, article(2, { url: 'javascript:1' }), article(3, { title: 5 }), null, 'x', article(4, { language: 7, date: 3, domain: undefined })],
    })
    expect(d.items.map((i) => i.title)).toEqual(['Headline 1', 'Headline 4'])
    expect(d.items[0]).toMatchObject({ id: 'https://site1.example/a1', kind: 'article', publisher: 'Wire', date: '3 hours ago', snippet: 'S', countryCode: null, topic: 'Topic one' })
    expect(d.items[1]).toMatchObject({ language: null, date: null, domain: 'site4.example', publisher: 'site4.example' })
    expect(d.unknownCountry).toBe(2)
  })

  it('merges the same canonical URL keeping the first', () => {
    const d = read({ articles: [article(1, { url: 'https://www.a.example/p#x', title: 'first' }), article(2, { url: 'https://A.EXAMPLE/p/', title: 'second' })] })
    expect(d.items.map((i) => i.title)).toEqual(['first'])
  })

  it('gives the publisher as outlet name, else source, else domain', () => {
    const arts = [article(1, { source: 'Src' }), article(2, { source: 'Src' }), article(3)]
    const d = read({ articles: arts, sources: [sourceArticle(arts[0], { name: 'Outlet One' }), sourceArticle(arts[1]), sourceArticle(arts[2])] })
    expect(d.items.map((i) => i.publisher)).toEqual(['Outlet One', 'Src', 'site3.example'])
  })
})

describe('readExplore verified country', () => {
  const arts = [article(1), article(2), article(3), article(4), article(5)]
  it('takes the country only from a matched, same-url outlet with a two-letter upper-case code', () => {
    const d = read({
      articles: arts,
      sources: [
        sourceArticle(arts[0], { country_code: 'DE', country: 'Germany' }),
        sourceArticle({ url: 'https://other.example/' }, { country_code: 'FR' }), // url mismatch
        sourceArticle(arts[2], { country_code: '', country: '' }), // empty code
        { ...sourceArticle(arts[3], { country_code: 'GB' }), matched: false }, // not matched
        sourceArticle(arts[4], { country_code: 'fi' }), // not upper-case
      ],
    })
    expect(d.items.map((i) => i.countryCode)).toEqual(['DE', null, null, null, null])
    expect(d.items[0].countryName).toBe('Germany')
    expect(d.unknownCountry).toBe(4)
    expect(d.geoStatus.status).toBe('succeeded')
  })

  it('never infers a country from language, domain TLD or text', () => {
    const d = read({ articles: [article(1, { language: 'fi', domain: 'yle.fi', url: 'https://yle.fi/a', snippet: 'Helsinki, Finland' })] })
    expect(d.items[0].countryCode).toBeNull()
  })

  it('ignores a source_info that did not succeed or is malformed, and survives non-array members', () => {
    const base = exploreJob({ articles: arts })
    const failing = { ...base, analyzers: [...base.analyzers, run('source_info', 'failed', { error: { code: 'adapter_error', message: 'x' } })] }
    expect(readExplore(failing as unknown as Job)).toMatchObject({ geoStatus: { status: 'failed', error: 'adapter_error' }, unknownCountry: 5 })
    const bad = { ...base, analyzers: [...base.analyzers, run('source_info', 'succeeded', { result: { articles: 'nope' } })] }
    expect(readExplore(bad as unknown as Job).geoStatus).toEqual({ status: 'failed', reason: null, error: 'unreadable_result' })
  })
})

describe('readExplore run states', () => {
  const states = (analyzers: unknown) => readExplore({ ...exploreJob(), analyzers } as unknown as Job)
  it('reports missing runs, never throwing on junk', () => {
    for (const analyzers of [[], undefined, null, 'x', [null, 5, { id: 'news_search', status: 'succeeded', result: 'junk' }]]) {
      const d = states(analyzers)
      expect(d.items).toEqual([])
      expect(['missing', 'failed']).toContain(d.newsStatus.status)
    }
    expect(states([]).newsStatus).toEqual({ status: 'missing', reason: null, error: null })
  })
  it('keeps reason and error code, reads an unknown status by the job state', () => {
    const d = states([run('news_search', 'skipped', { reason: 'brand_new_reason' }), run('fact_check', 'failed', { error: { code: 'timeout', message: '' } }), run('source_info', 'mystery')])
    expect(d.newsStatus).toMatchObject({ status: 'skipped', reason: 'brand_new_reason' })
    expect(d.factStatus).toMatchObject({ status: 'failed', error: 'timeout' })
    expect(d.geoStatus.status).toBe('skipped') // exploreJob() is done
    expect(readExplore({ ...exploreJob({ extra: { done: false, status: 'running' } }), analyzers: [run('source_info', 'mystery')] } as unknown as Job).geoStatus.status).toBe('pending')
  })
  it('lists the queries and ignores bad ones', () => {
    const d = read({ queries: [query('a', 'Topic A'), { q: 'b' }, null, query('c', 'News C', { origin: 'news', language: 'de' })] })
    expect(d.queries.map((q) => [q.q, q.original, q.origin, q.language])).toEqual([['a', 'Topic A', 'topic', 'en'], ['c', 'News C', 'news', 'de']])
  })
})

describe('readExplore fact-checks', () => {
  it('reads fact_check.fact_checks only and never classifies an article as a fact-check', () => {
    const d = read({
      articles: [article(1, { url: 'https://fc.example/check', title: 'a news piece' })],
      checks: [factCheck(), factCheck({ url: 'ftp://x.example', title: 'bad' }), factCheck({ url: 'https://fc2.example/c', title: '', claim: 'The claim', publisher: null, site: 'fc2.example', rating: 'Mixed' })],
    })
    const checks = d.items.filter((i) => i.kind === 'fact_check')
    expect(checks.map((i) => [i.title, i.publisher, i.date, i.rating, i.forClaim, i.countryCode])).toEqual([
      ['Check title', 'Fact Org', '2026-01-02', 'False', 'Claim text', null],
      ['The claim', 'fc2.example', '2026-01-02', 'Mixed', 'Claim text', null],
    ])
    expect(d.items.filter((i) => i.kind === 'article').map((i) => i.title)).toEqual(['a news piece'])
    expect(read({ articles: [article(1)] }).items.some((i) => i.kind === 'fact_check')).toBe(false)
  })
})
