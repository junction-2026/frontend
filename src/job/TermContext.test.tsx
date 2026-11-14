import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '../i18n'
import { job, run } from './fixtures'
import { TermContext } from './TermContext'
import JobView from './JobView'
import { Verdict } from './Verdict'

const ENC = 'https://en.wikipedia.org/w/index.php?title=Great_Reset&oldid=1250000000'
const enc = (extra: Record<string, unknown> = {}) => ({ quote: 'The Great Reset is an initiative.', title: 'Great Reset', url: ENC, language: 'en', page_id: 1, revision_id: 1250000000, ...extra })
const news = (n: number, extra: Record<string, unknown> = {}) => ({ snippet: `Snippet ${n} about the Great Reset`, url: `https://news.example/${n}`, title: `Article ${n}`, domain: `n${n}.example`, ...extra })
const term = (extra: Record<string, unknown> = {}) => ({ term: 'Great Reset', in_post: 'They call it the Great Reset!', encyclopedia: enc(), elsewhere: [news(0), news(1)], sense: 'same', differs_from: [], ...extra })
const result = (terms: unknown[], extra: Record<string, unknown> = {}) => ({ language: 'en', terms, requests_used: 1, cached: 0, usage: null, ...extra })
const show = (terms: unknown[], status = 'succeeded', extra: Record<string, unknown> = {}) => {
  const r = run('term_context', status, { result: status === 'succeeded' ? { ...result(terms), ...extra } : null })
  return render(<I18nProvider><TermContext job={job({ analyzers: [r] }) as never} /></I18nProvider>)
}

beforeEach(() => localStorage.clear())
afterEach(cleanup)

describe('Term context section', () => {
  it('renders one full card per term: post sentence, encyclopedia quote with link, news snippets with links, sense label', () => {
    const { container } = show([term(), term({ term: 'WEF', in_post: 'WEF said so.' })])
    const cards = container.querySelectorAll('.term-card')
    expect(cards).toHaveLength(2)
    const c = within(cards[0] as HTMLElement)
    expect(c.getByText('They call it the Great Reset!')).toBeInTheDocument()
    expect(c.getByText('The Great Reset is an initiative.')).toBeInTheDocument()
    expect(c.getByRole('link', { name: 'Great Reset' })).toHaveAttribute('href', ENC)
    expect(c.getByRole('link', { name: 'Article 0' })).toHaveAttribute('href', 'https://news.example/0')
    expect(c.getByText('Snippet 1 about the Great Reset')).toBeInTheDocument()
    expect(cards[0].querySelector('[data-sense-label="same"]')).toHaveTextContent('The quotes use the term for the same thing')
  })

  it('no_coverage shows a note instead of a quote', () => {
    const { container } = show([term({ encyclopedia: 'no_coverage' })])
    expect(container.querySelector('[data-source="encyclopedia"]')).toHaveTextContent('No Wikipedia page of its own for this term')
    expect(screen.queryByText('The Great Reset is an initiative.')).toBeNull()
  })

  it('non-object encyclopedia and unknown sense are tolerated', () => {
    const { container } = show([term({ encyclopedia: 42, sense: 'maybe', future: { x: 1 } })], 'succeeded', { extra_member: true })
    expect(container.querySelector('[data-source="encyclopedia"]')).toHaveTextContent('No Wikipedia page')
    expect(container.querySelector('[data-sense-label="unknown"]')).toBeInTheDocument()
  })

  it('empty elsewhere with unknown sense', () => {
    const { container } = show([term({ encyclopedia: 'no_coverage', elsewhere: [], sense: 'unknown' })])
    expect(container.querySelector('[data-source="elsewhere"]')).toHaveTextContent('No news snippet contains this term')
    expect(container.querySelector('[data-sense-label="unknown"]')).toHaveTextContent('No other quote to compare with')
  })

  it('differs marks the quotes of differs_from, ignores unresolvable refs, and never says the post is wrong', () => {
    const { container } = show([term({ sense: 'differs', differs_from: [{ source: 'elsewhere', index: 1 }, { source: 'elsewhere', index: 9 }, { source: 'x', index: null }] })])
    const marked = container.querySelectorAll('[data-differs]')
    expect(marked).toHaveLength(1)
    expect(marked[0]).toHaveTextContent('Snippet 1 about the Great Reset')
    expect(within(marked[0] as HTMLElement).getByRole('link', { name: 'Article 1' })).toBeInTheDocument()
    expect(container.querySelector('[data-sense-label="differs"]')).toHaveTextContent('different things')
    expect(container).not.toHaveTextContent(/\b(wrong|false|incorrect|misuse)/i)
  })

  it('differs from the encyclopedia marks the encyclopedia quote', () => {
    const { container } = show([term({ sense: 'differs', differs_from: [{ source: 'encyclopedia', index: null }] })])
    expect(container.querySelector('[data-source="encyclopedia"][data-differs]')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-differs]')).toHaveLength(1)
  })

  it('skipped, failed and missing runs read as unavailable, not as no terms', () => {
    for (const status of ['skipped', 'failed']) {
      const { container } = show([], status)
      expect(container).toHaveTextContent('No term context available')
      cleanup()
    }
    render(<I18nProvider><TermContext job={job() as never} /></I18nProvider>)
    expect(screen.getByText('No term context available')).toBeInTheDocument()
  })

  it('succeeded with no terms says none were picked; pending renders nothing', () => {
    expect(show([]).container).toHaveTextContent('No loaded or unfamiliar terms were picked')
    cleanup()
    expect(show([], 'pending').container).toBeEmptyDOMElement()
  })

  it('renders HTML and Markdown in quotes as text and links only allowed urls', () => {
    const html = '<b>x</b> [y](https://example.com)'
    const { container } = show([term({
      term: '<i>t</i>', in_post: html,
      encyclopedia: enc({ quote: html, url: 'https://example.com/w' }),
      elsewhere: [news(0, { snippet: html, url: 'javascript:alert(1)' }), news(1, { url: 'ftp://x/y' })],
    })])
    expect(container.querySelectorAll('b, i, img')).toHaveLength(0)
    expect(screen.getAllByText(html).length).toBe(3)
    expect(container.querySelectorAll('a')).toHaveLength(0)
    expect(container.querySelectorAll('[dir="auto"]').length).toBeGreaterThan(4)
  })

  it('quoted text is bidi-isolated', () => {
    show([term({ in_post: 'שלום עולם' })])
    expect(screen.getByText('שלום עולם')).toHaveAttribute('dir', 'auto')
  })
})

describe('QuoteRef index', () => {
  it('addresses the original elsewhere array, not the list of usable items', () => {
    const { container } = show([term({ sense: 'differs', elsewhere: [news(0, { snippet: '' }), news(1), news(2)], differs_from: [{ source: 'elsewhere', index: 2 }] })])
    const marked = container.querySelectorAll('[data-differs]')
    expect(marked).toHaveLength(1)
    expect(marked[0]).toHaveTextContent('Snippet 2 about the Great Reset')
  })
})

describe('placement', () => {
  it('comes after the Wikipedia section in the job view', () => {
    const wp = run('wikipedia', 'succeeded', { result: { languages: ['en'], claims: [], requests_used: 0, cached: 0 } })
    const tc = run('term_context', 'succeeded', { result: result([term()]) })
    const { container } = render(<I18nProvider><JobView job={job({ analyzers: [wp, tc] }) as never} /></I18nProvider>)
    const w = container.querySelector('.wiki-lookup')!
    const t = container.querySelector('.term-context')!
    expect(w.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('the final assessment shows no Wikipedia quotation from term context', () => {
    const tc = run('term_context', 'succeeded', { result: result([term()]) })
    const j = job({ analyzers: [tc] }) as never
    const { container } = render(<I18nProvider><Verdict job={j} /><JobView job={j} /></I18nProvider>)
    const quote = 'The Great Reset is an initiative.'
    expect(container.querySelectorAll('.term-context')).toHaveLength(1)
    expect(within(container.querySelector('.term-context') as HTMLElement).getByText(quote)).toBeInTheDocument()
    expect(screen.getAllByText(quote)).toHaveLength(1)
  })
})
