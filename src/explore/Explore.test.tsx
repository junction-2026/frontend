import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { job, json, run } from '../job/fixtures'
import ExploreView from '../views/ExploreView'
import { article, exploreJob, factCheck, query, sourceArticle } from './fixtures'

const fetchMock = vi.fn()
let current: () => Response | Promise<Response>
const serve = (j: unknown, status = 200) => (current = () => json(j, status))
beforeEach(() => {
  fetchMock.mockImplementation((url: string) => (String(url).startsWith('/api/v1/jobs/') ? current() : new Promise(() => {})))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  window.history.replaceState(null, '', '/')
})

const arts = [
  article(1, { title: 'Grid outage in Helsinki', snippet: '<img src=x onerror=alert(1)>', date: '3 hours ago', source: 'Wire' }),
  article(2, { language: 'fi', query: 'q two' }),
  article(3, { language: 'en' }),
  article(4, { language: 'de' }),
  article(5, { language: 'en', url: 'javascript:alert(1)' }), // dropped
]
const outlets = [
  sourceArticle(arts[0], { name: 'Helsingin Sanomat', domain: 'hs.fi', country_code: 'FI', country: 'Finland' }),
  sourceArticle(arts[1], { name: 'Yle', domain: 'yle.fi', country_code: 'FI', country: 'Finland' }),
  sourceArticle(arts[2], { name: 'Der Bote', domain: 'bote.de', country_code: 'DE', country: '' }),
  sourceArticle(arts[3]),
  sourceArticle(arts[4]),
]
const full = () =>
  exploreJob({
    articles: arts, sources: outlets, checks: [factCheck()],
    queries: [query('q one', 'Topic one'), query('q two', 'Topic two', { origin: 'news', language: 'fi' })],
  })
const show = async (j: unknown = full()) => {
  serve(j)
  render(<ExploreView id="j1" />)
  await screen.findByRole('heading', { level: 1, name: 'Explore the world.' })
  await screen.findByText('Related Coverage')
}
const path = (code: string) => document.querySelector<SVGPathElement>(`path[data-code="${code}"]`)!
const cards = () => screen.queryAllByRole('listitem').filter((li) => li.classList.contains('related-card'))
const status = (t: string | RegExp) => screen.findByText(t, { selector: '[role="status"]' })

describe('Explore without a job', () => {
  it('shows disabled filters, an empty map, a History link and makes no API call', () => {
    window.history.replaceState(null, '', '/explore')
    render(<App />)
    expect(screen.getByText('Open Explore coverage from a completed analysis to see where its stories were published.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open History →' })).toHaveAttribute('href', '/history')
    for (const b of screen.getAllByRole('button', { name: /No data/ })) expect(b).toBeDisabled()
    expect(screen.getByLabelText('Search topic text')).toBeDisabled()
    expect(fetchMock.mock.calls.map((c) => String(c[0])).filter((u) => u.includes('/jobs'))).toEqual([])
    expect(document.querySelector('.view [data-mock]')).toBeNull()
    expect(path('FI')).toHaveAttribute('fill', '#E9EDF2')
  })
})

describe('Explore job loading', () => {
  it('reads ?job= (URL-decoded), loads that job once and creates nothing', async () => {
    serve({ ...full(), id: 'a b' })
    window.history.replaceState(null, '', '/explore?job=a%20b')
    render(<App />)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    await screen.findByText('Related Coverage')
    const calls = fetchMock.mock.calls.filter((c) => String(c[0]).includes('/jobs'))
    expect(calls.map((c) => [c[0], c[1]?.method ?? 'GET'])).toEqual([['/api/v1/jobs/a%20b', 'GET']])
    expect(screen.getByRole('link', { name: /Back to analysis/ })).toHaveAttribute('href', '/jobs/a%20b')
  })

  it('treats a malformed escape as no job', () => {
    window.history.replaceState(null, '', '/explore?job=%E0%A4%A')
    render(<App />)
    expect(screen.getByText(/Open Explore coverage from a completed analysis/)).toBeInTheDocument()
  })

  it('shows "Job not found" for a 404', async () => {
    serve({ error: { code: 'job_not_found', message: 'nope' } }, 404)
    render(<ExploreView id="zz" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Job not found')
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
  })

  it('shows an API error with Retry that requests the job again', async () => {
    serve({ error: { code: 'internal_error', message: 'boom' } }, 500)
    render(<ExploreView id="j1" />)
    await screen.findByRole('alert')
    serve(full())
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await screen.findByText('Related Coverage')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows a network error', async () => {
    current = () => Promise.reject(new TypeError('offline'))
    render(<ExploreView id="j1" />)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})

describe('Explore analyzer states', () => {
  const states: [string, unknown[], string | RegExp, Partial<Record<string, unknown>>?][] = [
    ['news_search pending', [run('news_search', 'pending')], 'Searching news coverage…', { done: false, status: 'running' }],
    ['news_search running', [run('news_search', 'running')], 'Searching news coverage…', { done: false, status: 'running' }],
    ['news_search missing', [], 'Coverage search is not available for this analysis'],
    ['news_search skipped', [run('news_search', 'skipped', { reason: 'no_searchable_topics' })], /Coverage search was skipped: no searchable topics/],
    ['news_search skipped, unknown reason', [run('news_search', 'skipped', { reason: 'new_thing' })], 'Coverage search was skipped: new_thing'],
    ['news_search failed', [run('news_search', 'failed', { error: { code: 'adapter_error', message: 'x' } })], 'Coverage search failed (error code: adapter_error)'],
    ['zero articles', [run('news_search', 'succeeded', { result: { queries: [], articles: [] } })], /No related articles were found\. This is not evidence/],
  ]
  it.each(states)('%s', async (_n, analyzers, text, extra = {}) => {
    serve(job({ analyzers, ...extra }))
    render(<ExploreView id="j1" />)
    expect(await status(text)).toBeInTheDocument()
    expect(screen.queryByText('Related Coverage')).toBeNull()
    expect(screen.queryByText(/never exist|no coverage exists/i)).toBeNull()
    expect(screen.getByRole('img', { name: 'World coverage map' })).toBeInTheDocument()
  })

  it('shows a failed job with the results that exist', async () => {
    await show(exploreJob({ articles: arts, extra: { status: 'failed' } }))
    expect(screen.getByText(/This analysis failed; showing the results that exist/)).toBeInTheDocument()
    expect(cards()).toHaveLength(4)
  })

  it('does not wait forever for a pending search of a finished job', async () => {
    serve(job({ analyzers: [run('news_search', 'pending')], status: 'cancelled' }))
    render(<ExploreView id="j1" />)
    expect(await status('Coverage search did not finish for this analysis')).toBeInTheDocument()
    expect(screen.getByText(/This analysis was cancelled/)).toBeInTheDocument()
  })

  it.each([
    ['source_info pending', [run('source_info', 'pending')], 'Matching publishers…', { done: false, status: 'running' }],
    ['source_info running', [run('source_info', 'running')], 'Matching publishers…', { done: false, status: 'running' }],
    ['source_info missing', [], 'Geographic data unavailable for this analysis', {}],
    ['source_info skipped', [run('source_info', 'skipped', { reason: 'dependency_failed' })], 'Geographic data unavailable for this analysis', {}],
    ['source_info failed', [run('source_info', 'failed', { error: { code: 'adapter_error', message: '' } })], 'Geographic data unavailable for this analysis', {}],
  ])('%s: articles are listed and the map is empty', async (_n, extra, text, jobExtra) => {
    const base = exploreJob({ articles: arts })
    await show({ ...base, ...jobExtra, analyzers: [...base.analyzers, ...extra] })
    expect(await status(text)).toBeInTheDocument()
    expect(cards()).toHaveLength(4)
    expect(document.querySelectorAll('path[fill="#9FC4ED"], path[fill="#DCEBFA"], path[fill="#BFD9F4"]')).toHaveLength(0)
  })

  it('completed with no verified country says so and counts every article as unknown', async () => {
    await show(exploreJob({ articles: arts, sources: arts.map((a) => sourceArticle(a)) }))
    expect(screen.getByText('Geographic data unavailable for this analysis')).toBeInTheDocument()
    expect(screen.getByText('No verified publisher-country data yet · 4 articles with country unknown')).toBeInTheDocument()
    expect(screen.getAllByText('Country unknown')).toHaveLength(4)
  })
})

describe('Explore data', () => {
  it('renders items, subtitle and topics from the job, with no mock marks', async () => {
    await show()
    expect(cards()).toHaveLength(4)
    expect(screen.getByText('3 publishers across 2 countries · 1 article with country unknown')).toBeInTheDocument()
    expect(screen.getByText(/Searched topics: Topic one · Topic two ·/)).toBeInTheDocument()
    expect(document.querySelector('.view [data-mock]')).toBeNull()
    expect(screen.getByText('4 articles · 4 publishers')).toBeInTheDocument()
    const first = within(cards()[0])
    expect(first.getByText('Grid outage in Helsinki')).toBeInTheDocument()
    expect(first.getByText('Helsingin Sanomat')).toBeInTheDocument() // outlet name beats Article.source
    expect(first.getByText('3 hours ago')).toBeInTheDocument()
    expect(first.getByText('EN')).toBeInTheDocument()
    expect(first.getByText('Finland')).toBeInTheDocument()
    expect(within(cards()[3]).getByText('Country unknown')).toBeInTheDocument()
  })

  it('renders links safely and a markup snippet as plain text', async () => {
    await show()
    const link = screen.getByRole('link', { name: 'Grid outage in Helsinki' })
    expect(link).toHaveAttribute('href', 'https://site1.example/a1')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(document.querySelector('.related img')).toBeNull()
    expect(document.querySelector('a[href^="javascript"]')).toBeNull()
  })

  it('shades the map, shows the tooltip and uncovered tooltip from the filtered aggregation', async () => {
    await show()
    expect(path('FI')).toHaveAttribute('fill', '#9FC4ED') // 2 of max 2
    expect(path('DE')).toHaveAttribute('fill', '#BFD9F4') // 1 of max 2: above a third
    fireEvent.pointerEnter(path('FI'), { clientX: 10, clientY: 10 })
    expect(screen.getByRole('tooltip')).toHaveTextContent('Finland')
    expect(screen.getByRole('tooltip')).toHaveTextContent('2 articles · 2 publishers')
    fireEvent.pointerLeave(path('FI'))
    fireEvent.pointerEnter(path('DE'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Germany') // Outlet.country empty: bundled name
    fireEvent.pointerEnter(path('FR'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('No verified publisher data')
    expect(screen.getByRole('tooltip')).not.toHaveTextContent(/\d/)
  })

  it('selects a country from the map, filters the list and panel, and clears without a refetch', async () => {
    await show()
    const fetches = fetchMock.mock.calls.length
    fireEvent.click(path('FI'))
    expect(path('FI')).toHaveAttribute('data-selected', 'true')
    expect(screen.getByLabelText('Country')).toHaveValue('FI')
    const panel = within(document.querySelector<HTMLElement>('.country-panel')!)
    expect(panel.getByText('2 articles · 2 publishers')).toBeInTheDocument()
    expect(panel.getByText('Languages: EN, FI')).toBeInTheDocument()
    expect(panel.getAllByRole('listitem')).toHaveLength(2)
    expect(panel.getByText(/Grid outage in Helsinki — Helsingin Sanomat · 3 hours ago/)).toBeInTheDocument()
    expect(panel.getByRole('link', { name: 'Inspect wire feeds →' })).toHaveAttribute('href', '/explore/region')
    expect(cards()).toHaveLength(2)
    expect(path('DE')).toHaveAttribute('fill', '#BFD9F4') // other countries stay shaded
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(cards()).toHaveLength(4)
    expect(document.querySelector('.country-panel')).toBeNull()
    expect(fetchMock.mock.calls.length).toBe(fetches)
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'FR' } })
    expect(screen.getByText('No verified publisher data for France')).toBeInTheDocument()
    expect(cards()).toHaveLength(0)
    expect(screen.getByText('No items match the current filters.')).toBeInTheDocument()
  })

  it('navigates to the mock region screen from the panel', async () => {
    await show()
    fireEvent.click(path('FI'))
    fireEvent.click(screen.getByRole('link', { name: 'Inspect wire feeds →' }))
    expect(window.location.pathname).toBe('/explore/region')
  })

  it('applies topic, text, language and publisher filters to map, tooltip, list and counts alike', async () => {
    await show()
    const count = () => cards().length
    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'Topic two' } })
    expect(count()).toBe(1)
    expect(screen.getByText('1 article · 1 publisher')).toBeInTheDocument()
    expect(screen.getByText('1 publisher across 1 country')).toBeInTheDocument()
    expect(path('DE')).toHaveAttribute('fill', '#E9EDF2')
    fireEvent.pointerEnter(path('FI'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('1 article · 1 publisher')
    fireEvent.pointerLeave(path('FI'))
    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Search topic text'), { target: { value: 'helsinki' } })
    expect(count()).toBe(1)
    fireEvent.change(screen.getByLabelText('Search topic text'), { target: { value: '' } })
    fireEvent.click(screen.getByLabelText('DE (1)'))
    expect(count()).toBe(1)
    expect(path('FI')).toHaveAttribute('fill', '#E9EDF2')
    fireEvent.click(screen.getByLabelText('DE (1)'))
    fireEvent.click(screen.getByLabelText('Yle (1)'))
    expect(count()).toBe(1)
    expect(screen.getByRole('link', { name: 'Headline 2' })).toBeInTheDocument()
  })

  it('enables Verified fact-checks only with a fact-check and lists only FactChecks when on', async () => {
    await show()
    const box = screen.getByLabelText('Verified fact-checks only')
    expect(box).toBeEnabled()
    fireEvent.click(box)
    expect(cards()).toHaveLength(1)
    expect(screen.getByText('Fact-check of: Claim text')).toBeInTheDocument()
    expect(within(cards()[0]).getByText('False')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Check title' })).toHaveAttribute('href', 'https://fc.example/check')
    expect(screen.queryByText('Headline 1')).toBeNull()
    expect(screen.getByText('1 fact-check · 1 publisher')).toBeInTheDocument()
  })

  it('disables the fact-check filter without fact-checks, and filters without values', async () => {
    await show(exploreJob({ articles: [article(1, { language: null })], checks: [] }))
    expect(screen.getByLabelText('Verified fact-checks only')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Languages: No data' })).toBeDisabled()
    expect(screen.getByLabelText('Topic')).toBeEnabled()
  })

  it('labels the Topic select "No data" when there are no queries', async () => {
    await show(exploreJob({ articles: [article(1)], queries: [] }))
    expect(screen.getByLabelText('Topic')).toBeDisabled()
  })
})

describe('Explore live updates', () => {
  it('fills in the map and list as news_search and source_info settle, keeping filters and selection', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const base = (extra: Record<string, unknown>, analyzers: unknown[]) => ({ ...exploreJob({ extra }), analyzers })
    const news = (r: unknown) => run('news_search', 'succeeded', { result: { queries: [query('q one', 'Topic one')], articles: [arts[0], arts[1]], ...(r as object) } })
    const steps = [
      base({ done: false, status: 'running' }, [run('news_search', 'running')]),
      base({ done: false, status: 'running' }, [news({}), run('source_info', 'running')]),
      base({}, [news({}), run('source_info', 'succeeded', { result: { articles: outlets.slice(0, 2), page_outlet: null, summary: {}, table: {} } })]),
    ]
    let n = 0
    current = () => json(steps[Math.min(n++, 2)])
    render(<ExploreView id="j1" />)
    expect(await status('Searching news coverage…')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(await status('Matching publishers…')).toBeInTheDocument()
    expect(cards()).toHaveLength(2)
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'FI' } }) // selected before FI has any item
    expect(screen.getByText('No verified publisher data for Finland')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(2000))
    await waitFor(() => expect(screen.queryByText('Matching publishers…')).toBeNull())
    expect(screen.getByLabelText('Country')).toHaveValue('FI')
    expect(screen.getByText('2 articles · 2 publishers', { selector: '.country-panel span' })).toBeInTheDocument()
    expect(path('FI')).toHaveAttribute('data-selected', 'true')
    expect(cards()).toHaveLength(2)
  })
})

describe('Explore entry points', () => {
  it('the Results link reads "Explore coverage" and points at /explore?job=<id>', async () => {
    serve(job({ id: 'j 1' }))
    window.history.replaceState(null, '', '/jobs/j%201')
    render(<App />)
    expect(await screen.findByRole('link', { name: 'Explore coverage' })).toHaveAttribute('href', '/explore?job=j%201')
    expect(screen.queryByText(/Cross-source coverage/)).toBeNull()
  })
  it('the nav link stays /explore', () => {
    window.history.replaceState(null, '', '/history')
    render(<App />)
    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('href', '/explore')
  })
})
