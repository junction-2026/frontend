import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '../i18n'
import { job, run } from './fixtures'
import { WikipediaLookup, wikiHref } from './WikipediaLookup'

const DE = 'https://de.wikipedia.org/w/index.php?title=Rentenalter&oldid=11'
const EN = 'https://en.wikipedia.org/w/index.php?title=Retirement_age&oldid=22'
const wiki = (language: string, extra: Record<string, unknown> = {}) => ({
  language, query: 'q', status: 'found', cached: false, title: language === 'de' ? 'Rentenalter' : 'Retirement age',
  url: language === 'de' ? DE : EN, passage: `Passage ${language}`, coverage: 'mentioned', evidence_sentence: null, ...extra,
})
const claim = (extra: Record<string, unknown> = {}) => ({ claim: 'The retirement age is 67.', check_worthiness: 0.8, search_mode: 'fulltext', wikis: [wiki('de'), wiki('en')], ...extra })
const result = (claims: unknown[]) => ({ languages: ['de', 'en'], claims, requests_used: 2, cached: 0 })
const show = (claims: unknown[], status = 'succeeded') => {
  const wp = run('wikipedia', status, { result: status === 'succeeded' ? result(claims) : null })
  return render(<I18nProvider><WikipediaLookup job={job({ analyzers: [wp] }) as never} /></I18nProvider>)
}
const cross = (c: HTMLElement) => c.querySelector('[data-cross]')

beforeEach(() => localStorage.clear())
afterEach(cleanup)

describe('Wikipedia lookup section', () => {
  it('shows each passage verbatim and apart with language, linked title and coverage label, and no verdict', () => {
    const { container } = show([claim({ cross_language: 'agree', cross_language_differences: null })])
    const eds = container.querySelectorAll('.wiki-edition')
    expect(eds).toHaveLength(2)
    expect(within(eds[0] as HTMLElement).getByText('Passage de')).toBeInTheDocument()
    expect(within(eds[1] as HTMLElement).getByText('Passage en')).toBeInTheDocument()
    expect(eds[0]).toHaveTextContent('Wikipedia (German)')
    expect(within(eds[0] as HTMLElement).getByRole('link', { name: 'Rentenalter' })).toHaveAttribute('href', DE)
    expect(eds[0].querySelector('[data-coverage="mentioned"]')).toBeInTheDocument()
    expect(container).not.toHaveTextContent(/\b(true|false|verdict)\b/i)
  })

  it('agree: neutral state, also without any values', () => {
    const { container } = show([claim({ cross_language: 'agree', cross_language_differences: null })])
    expect(cross(container)).toHaveTextContent('Both editions give the same numbers and dates')
    expect(cross(container)).toHaveClass('wiki-cross-agree')
    expect(container.querySelector('.tag.orange')).toBeNull()
  })

  it('discrepancy quotes each side\'s differing values with language and link', () => {
    const { container } = show([claim({
      cross_language: 'discrepancy',
      cross_language_differences: [
        { language: 'de', url: DE, values: [{ kind: 'number', value: '67', text: '67' }] },
        { language: 'en', url: EN, values: [{ kind: 'number', value: '70', text: '70' }] },
      ],
    })])
    const c = cross(container) as HTMLElement
    expect(c).toHaveClass('wiki-cross-discrepancy')
    const items = c.querySelectorAll(':scope > ul > li')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Wikipedia (German)')
    expect(items[0]).toHaveTextContent('“67”')
    expect(within(items[0] as HTMLElement).getByRole('link')).toHaveAttribute('href', DE)
    expect(items[1]).toHaveTextContent('“70”')
    expect(c).not.toHaveClass('orange')
    expect(container.querySelector('.tag.orange')).toBeNull() // coverage "conflicts" styling is not used for discrepancy
  })

  it('discrepancy with one empty side lists no value for that side', () => {
    const { container } = show([claim({
      cross_language: 'discrepancy',
      cross_language_differences: [
        { language: 'de', url: DE, values: [] },
        { language: 'en', url: EN, values: [{ kind: 'number', value: '1945', text: '1945' }] },
      ],
    })])
    const items = (cross(container) as HTMLElement).querySelectorAll(':scope > ul > li')
    expect(items[0]).toHaveTextContent('No value of its own')
    expect(items[0].querySelectorAll('.wiki-values li')).toHaveLength(0)
    expect(items[1]).toHaveTextContent('“1945”')
  })

  it('gap is neutral even when the found edition has coverage conflicts', () => {
    const { container } = show([claim({
      cross_language: 'gap', cross_language_differences: null,
      wikis: [wiki('de', { status: 'no_page', title: null, url: null, passage: null, coverage: 'no_coverage' }), wiki('en', { coverage: 'conflicts', evidence_sentence: 'It is 70.' })],
    })])
    const g = cross(container) as HTMLElement
    expect(g).toHaveTextContent('Only one language edition had a page for this claim')
    expect(g.textContent).not.toMatch(/conflict|discrepan|differ|disagree/i)
    expect(g).toHaveClass('wiki-cross-gap')
    expect(g.className).not.toMatch(/discrepancy|orange/)
    expect(container.querySelectorAll('[data-coverage="conflicts"]')).toHaveLength(1) // only the found WikiLookup
    expect(container.querySelectorAll('.tag.orange')).toHaveLength(1)
    expect(screen.getByText('It is 70.')).toBeInTheDocument()
    expect(screen.getByText('No page found in this edition')).toBeInTheDocument()
  })

  it.each([['null', null], ['missing', undefined], ['unknown', 'partial']])('%s cross_language shows no comparison and no error', (_n, v) => {
    const { container } = show([claim(v === undefined ? {} : { cross_language: v })])
    expect(cross(container)).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(container.querySelectorAll('.wiki-edition')).toHaveLength(2)
  })

  it('renders markup in a passage literally, creates no link, and isolates direction', () => {
    const md = '<b>bold</b> [x](https://example.com) https://example.com'
    const { container } = show([claim({ claim: '<i>c</i>', wikis: [wiki('en', { passage: md, title: '<u>T</u>', url: 'http://en.wikipedia.org/x' })] })])
    const p = container.querySelector('.wiki-passage') as HTMLElement
    expect(p.textContent).toBe(md)
    expect(p).toHaveAttribute('dir', 'auto')
    expect(container.querySelector('b, i, u, a')).toBeNull()
    expect(container).toHaveTextContent('<i>c</i>')
    expect(container).toHaveTextContent('<u>T</u>')
  })

  it.each([
    ['http://de.wikipedia.org/x'], ['https://evil.example/de.wikipedia.org'], ['https://de.wikipedia.org.evil.example/x'],
    ['https://wikipedia.org/x'], ['//de.wikipedia.org/x'], ['/w/index.php'], ['javascript:alert(1)'], [''], [null],
  ])('does not link %s', (url) => {
    expect(wikiHref(url)).toBeNull()
    const { container } = show([claim({
      cross_language: 'discrepancy',
      cross_language_differences: [{ language: 'de', url, values: [{ kind: 'number', value: '1', text: '1' }] }, { language: 'en', url: EN, values: [] }],
      wikis: [wiki('de', { url }), wiki('en')],
    })])
    expect(container.querySelectorAll('a')).toHaveLength(2) // only the en edition and its difference entry
    expect(container.querySelector(`a[href="${url}"]`)).toBeNull()
  })

  it('links an https *.wikipedia.org url', () => expect(wikiHref(DE)).toBe(DE))

  it('treats unknown or absent coverage and unknown status like no_coverage / no_page', () => {
    const { container } = show([claim({ wikis: [wiki('de', { coverage: 'partially_aligned' }), wiki('en', { coverage: undefined }), wiki('fr', { status: 'redirect_loop' })] })])
    expect(container.querySelectorAll('[data-coverage="no_coverage"]')).toHaveLength(2)
    expect(screen.getByText('No page found in this edition')).toBeInTheDocument()
  })

  it.each(['failed', 'skipped'])('a %s run shows "no Wikipedia lookup available"', (status) => {
    show([], status)
    expect(screen.getByText('No Wikipedia lookup available')).toBeInTheDocument()
  })

  it('a missing run shows "no Wikipedia lookup available"; a running one shows nothing', () => {
    render(<I18nProvider><WikipediaLookup job={job() as never} /></I18nProvider>)
    expect(screen.getByText('No Wikipedia lookup available')).toBeInTheDocument()
    cleanup()
    const { container } = render(<I18nProvider><WikipediaLookup job={job({ analyzers: [run('wikipedia', 'running')] }) as never} /></I18nProvider>)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows no counts', () => {
    const { container } = show([claim({ cross_language: 'gap' }), claim({ cross_language: 'discrepancy', cross_language_differences: [] })])
    expect(container.querySelector('.wiki-lookup h3')?.textContent).toBe('Wikipedia lookup')
    expect(container.querySelector('.wiki-lookup > .badge-soft, .wiki-lookup h3 + .badge-soft')).toBeNull()
  })
})
