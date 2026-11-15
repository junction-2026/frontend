import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { article, exploreJob, factCheck, outlet, query } from '../explore/fixtures'
import { coverage, job, json } from '../job/fixtures'
import { CATALOGS } from './translate'

const LOCALES = ['en', 'fr', 'ar', 'de', 'fi', 'ru'] as const
const ARTICLES = [
  article(1, { title: 'Grid outage in Helsinki', date: 'today', source: 'Wire' }),
  article(2, { title: 'Storm in Berlin', language: 'de', query: 'q two' }),
]
const SOURCES = [
  { url: ARTICLES[0].url, domain: 'x', matched: true, match: 'host', outlet: outlet({ name: 'Helsingin Sanomat', domain: 'hs.fi', country_code: 'FI', country: 'Finland' }) },
  { url: ARTICLES[1].url, domain: 'x', matched: true, match: 'host', outlet: outlet({ name: 'Der Bote', domain: 'bote.de', country_code: 'DE', country: 'Germany' }) },
]
const EXPLORE = exploreJob({ articles: ARTICLES, sources: SOURCES, checks: [factCheck()], queries: [query('q one', 'Topic one'), query('q two', 'Topic two')] })
const summary = (id: string, status: string) => ({ id, status, done: true, created_at: new Date().toISOString(), finished_at: null, coverage: coverage(), finalization: { status: 'completed', verdict: 'detected' }, excerpt: 'The excerpt of the job.' })

const fetchMock = vi.fn()
beforeEach(() => {
  fetchMock.mockImplementation(async (url: string) => {
    if (url === '/healthz') return json({ status: 'ok' })
    if (url === '/api/v1/analyzers') return json({ items: [{ id: 'rhetoric', name: 'Rhetoric', category: 'linguistic', enabled: true, selectable: true, depends_on: [], trigger: 'on_input' }, { id: 'final', name: 'Final synthesis', category: 'verdict', enabled: false, selectable: false, depends_on: ['rhetoric'], trigger: 'after_all_analyzers_settled' }] })
    if (url.startsWith('/api/v1/jobs?')) {
      const completed = url.includes('status=completed')
      return json({ items: completed ? [summary('job-ok', 'completed')] : [summary('job-ok', 'completed'), summary('job-run', 'running')], next_cursor: null })
    }
    if (url === '/api/v1/jobs/j1') return json(EXPLORE)
    return json(job({ id: url.split('/').pop(), input: { content: 'The excerpt of the job.' } }))
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  localStorage.clear()
  sessionStorage.clear()
  window.history.replaceState(null, '', '/')
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
})

const open = (path: string, locale: string) => {
  localStorage.setItem('veil.locale', locale)
  window.history.replaceState(null, '', path)
  return render(<App />)
}
const requests = () => fetchMock.mock.calls.map((c) => String(c[0]))

// The text a reader sees that the UI itself wrote: attributes and text, without data (<bdi>, dir=auto), the keycap, the brand initial, and the language names, which are shown in their own language.
function staticText(): string {
  const root = document.querySelector('.app-shell')!.cloneNode(true) as HTMLElement
  root.querySelectorAll('bdi, [dir=auto], .kbd, .avatar-sm, svg, .lang-select').forEach((e) => e.remove())
  const attrs = [...root.querySelectorAll('[aria-label],[placeholder],[title]')].flatMap((e) => ['aria-label', 'placeholder', 'title'].map((a) => e.getAttribute(a) ?? ''))
  return [root.textContent, ...attrs].join(' ').replaceAll('VEIL', '')
}

type Page = { name: string; path: string; ready: () => Promise<unknown>; h1: string }
const PAGES: Page[] = [
  { name: 'Home', path: '/', ready: async () => {}, h1: 'home.title' },
  { name: 'Explore', path: '/explore?job=j1', ready: () => screen.findByRole('list', {}, { timeout: 3000 }), h1: 'explore.title' },
  { name: 'History', path: '/history', ready: () => waitFor(() => expect(document.querySelector('.history-item')).not.toBeNull()), h1: 'history.title' },
  { name: 'Ask', path: '/jobs/job-ok/ask', ready: () => screen.findByRole('textbox'), h1: 'ask.title' },
  { name: 'Ask without a job', path: '/ask', ready: async () => {}, h1: 'ask.title' },
  { name: 'Region', path: '/explore/region', ready: async () => {}, h1: 'explore.title' },
]

describe.each(PAGES)('$name in every locale', ({ path, ready, h1 }) => {
  it.each(LOCALES)('%s: sets lang and dir, shows catalog text and no raw keys', async (lng) => {
    open(path, lng)
    await ready()
    expect(document.documentElement).toHaveAttribute('lang', lng)
    expect(document.documentElement).toHaveAttribute('dir', lng === 'ar' ? 'rtl' : 'ltr')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(CATALOGS[lng][h1])
    expect(screen.getByRole('link', { name: CATALOGS[lng]['shell.nav.history'] })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\b(home|explore|history|shell|common)\.[a-z_]+/)
    expect(document.body.textContent).not.toMatch(/undefined|null|…$/)
  })

  it('ar: has no Latin-script static text other than the brand', async () => {
    open(path, 'ar')
    await ready()
    expect(staticText().match(/[A-Za-z][A-Za-z.,'’ -]*/g) ?? []).toEqual([])
  })
})

describe('Home Advanced options panel in Arabic', () => {
  it('mirrors, shows localized panel strings and isolates API values in bdi', async () => {
    open('/', 'ar')
    fireEvent.click(screen.getByRole('button', { name: CATALOGS.ar['home.advanced'] }))
    await screen.findByText('Rhetoric')
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    const panel = document.getElementById('advanced-options')!
    expect(panel).toHaveTextContent('1 من 2 محلِّلات مفعّلة')
    for (const v of ['Rhetoric', 'rhetoric', 'linguistic', 'Final synthesis', 'final']) expect(within(panel).getAllByText(v)[0].closest('bdi')).not.toBeNull()
    expect(panel).toHaveTextContent(CATALOGS.ar['home.analyzer_always_on'])
    expect(panel).toHaveTextContent(CATALOGS.ar['home.analyzer_final'])
    expect(panel).toHaveTextContent('يعتمد على: rhetoric')
    expect(staticText().match(/[A-Za-z][A-Za-z.,'’ -]*/g) ?? []).toEqual([])
  })
})

describe('Arabic isolation', () => {
  it('keeps source text of Explore inside bdi and country names in Arabic', async () => {
    open('/explore?job=j1', 'ar')
    await screen.findByRole('list')
    const title = screen.getByText('Grid outage in Helsinki')
    expect(title.closest('a')).toHaveAttribute('dir', 'auto')
    for (const e of screen.getAllByText('Helsingin Sanomat')) expect(e.closest('bdi')).not.toBeNull()
    expect(screen.getAllByText('فنلندا').length).toBeGreaterThan(0)
  })

  it('keeps History ids and excerpts inside bdi', async () => {
    open('/history', 'ar')
    await waitFor(() => expect(document.querySelector('.history-item')).not.toBeNull())
    await screen.findAllByText(/The excerpt of the job/)
    expect(screen.getAllByText('job-ok')[0].closest('bdi')).not.toBeNull()
    for (const e of screen.getAllByText(/The excerpt of the job/)) expect(e.closest('bdi')).not.toBeNull()
  })

  it('isolates Ask bubbles with dir=auto and keeps the brand verbatim', async () => {
    sessionStorage.setItem('veil.ask.job-ok', JSON.stringify([{ role: 'user', content: 'Why?' }, { role: 'assistant', content: 'Because of reasons.' }]))
    open('/jobs/job-ok/ask', 'ar')
    await screen.findByRole('textbox')
    expect(screen.getByText('Because of reasons.')).toHaveAttribute('dir', 'auto')
    expect(screen.getByText('Why?')).toHaveAttribute('dir', 'auto')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('VEIL')
  })
})

describe('switching the language', () => {
  const pick = (code: string) => fireEvent.change(document.querySelector('.lang-select')!, { target: { value: code } })

  it('keeps the Explore route and country selection and requests nothing new', async () => {
    open('/explore?job=j1', 'en')
    await screen.findByRole('list')
    fireEvent.click(document.querySelector('path[data-code="FI"]')!)
    const before = requests()
    pick('ar')
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(window.location.pathname + window.location.search).toBe('/explore?job=j1')
    expect(document.querySelector('path[data-code="FI"]')).toHaveAttribute('data-selected', 'true')
    expect(document.querySelector('.country-panel strong')).toHaveTextContent('فنلندا') // country names follow the locale
    expect(requests()).toEqual(before)
    expect(screen.getAllByRole('listitem').filter((li) => li.classList.contains('related-card'))).toHaveLength(1)
    pick('fr')
    expect(document.querySelector('.country-panel strong')).toHaveTextContent('Finlande')
    expect(requests()).toEqual(before)
  })

  it('keeps the History status filter and list without a new request', async () => {
    open('/history', 'en')
    await waitFor(() => expect(document.querySelectorAll('.history-item')).toHaveLength(2))
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }))
    await waitFor(() => expect(document.querySelectorAll('.history-item')).toHaveLength(1))
    const before = requests()
    pick('de')
    expect(window.location.pathname).toBe('/history')
    expect(screen.getByRole('button', { name: CATALOGS.de['history.filter.completed'] })).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelectorAll('.history-item')).toHaveLength(1)
    expect(requests()).toEqual(before)
  })

  it('keeps what was typed on Home and persists the choice', async () => {
    open('/', 'en')
    fireEvent.change(screen.getByLabelText('Content to analyze'), { target: { value: 'typed text' } })
    pick('ar')
    expect(screen.getByLabelText(CATALOGS.ar['home.input_label'])).toHaveValue('typed text')
    expect(localStorage.getItem('veil.locale')).toBe('ar')
  })
})
