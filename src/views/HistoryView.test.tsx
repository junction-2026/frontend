import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { coverage, job, json } from '../job/fixtures'
import { I18nProvider, formatDate, useLocale } from '../i18n'
import HistoryView from './HistoryView'

const fetchMock = vi.fn()
const NOW = new Date(2026, 10, 14, 12, 0, 0) // local noon
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString()
const H = 3600_000

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  localStorage.clear()
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
})

const summary = (id: string, extra: Record<string, unknown> = {}) => ({
  id, status: 'completed', done: true, created_at: ago(H), finished_at: ago(H), coverage: coverage(),
  finalization: { status: 'completed', verdict: 'detected' }, ...extra,
})
const page = (items: unknown[], next_cursor: string | null = null) => json({ items, next_cursor })
// Routes list requests to `list` and per-job requests to `detail` (default: a job whose content is `text of <id>`).
const route = (list: (url: string) => Response, detail: (id: string) => Promise<Response> | Response = (id) => json(job({ id, input: { content: `text of ${id}` } }))) =>
  fetchMock.mockImplementation(async (url: string) => (/^\/api\/v1\/jobs\?/.test(url) ? list(url) : detail(decodeURIComponent(url.split('/').pop() as string))))
const listUrls = () => fetchMock.mock.calls.map((c) => c[0] as string).filter((u) => u.startsWith('/api/v1/jobs?'))
const inMock = (el: HTMLElement) => el.closest('[data-mock]')

describe('History', () => {
  it('lists jobs as returned (newest first), grouped by local day with item counts', async () => {
    route(() => page([summary('a', { created_at: ago(H) }), summary('b', { created_at: ago(2 * H) }), summary('c', { created_at: ago(24 * H) }), summary('d', { created_at: ago(5 * 24 * H) })]))
    render(<HistoryView />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    await screen.findByText('Today')
    expect(listUrls()).toEqual(['/api/v1/jobs?limit=20'])
    const labels = [...document.querySelectorAll('.day-label')].map((d) => d.textContent)
    expect(labels).toEqual([
      'Today2 analyses',
      'Yesterday1 analysis',
      `${formatDate(ago(5 * 24 * H), { year: 'numeric', month: 'short', day: 'numeric' }, 'en')}1 analysis`,
    ])
    expect([...document.querySelectorAll('.history-item .top span:first-child')].map((e) => e.textContent)).toEqual(['a', 'b', 'c', 'd'])
    expect(screen.getByText('1 hour ago')).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('shows status pill, verdict tag (or the finalization status when null), reopen link and no counts', async () => {
    route(() => page([
      summary('a', { finalization: { status: 'completed', verdict: 'not_detected' } }),
      summary('b', { status: 'running', done: false, finalization: { status: 'pending', verdict: null } }),
      summary('c', { finalization: { status: 'completed', verdict: 'odd' } }),
    ]))
    render(<HistoryView />)
    await screen.findByText('No manipulation indicators')
    expect(screen.getByText('Final assessment: pending')).toBeInTheDocument()
    expect(screen.getByText('Uncertain')).toHaveClass('tag', 'purple')
    expect(screen.getByText('running')).toHaveClass('status-pill', 'blue')
    expect(screen.getAllByRole('link', { name: 'Reopen Analysis →' }).map((l) => l.getAttribute('href'))).toEqual(['/jobs/a', '/jobs/b', '/jobs/c'])
    for (const chip of ['All', 'Running', 'Completed', 'Failed', 'Cancelled']) expect(screen.getByRole('button', { name: chip })).toBeInTheDocument()
    expect(screen.queryByText(/\(\d+\)/)).toBeNull()
  })

  it('loads more with the cursor, appends, and hides the button on the last page', async () => {
    route((url) => (url.includes('cursor=c1') ? page([summary('b')], null) : page([summary('a')], 'c1')))
    render(<HistoryView />)
    fireEvent.click(await screen.findByRole('button', { name: 'Load more' }))
    await screen.findByText('b')
    expect(listUrls()[1]).toBe('/api/v1/jobs?limit=20&cursor=c1')
    expect(screen.getAllByRole('link', { name: 'Reopen Analysis →' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull()
  })

  it('maps filter chips to ?status= and resets pagination; All omits it', async () => {
    route((url) => page([summary(url.includes('status=failed') ? 'f1' : 'a')], url.includes('cursor') ? null : 'c1'))
    render(<HistoryView />)
    fireEvent.click(await screen.findByRole('button', { name: 'Load more' }))
    await waitFor(() => expect(listUrls()).toHaveLength(2))
    fireEvent.click(screen.getByRole('button', { name: 'Failed' }))
    await screen.findByText('f1')
    expect(listUrls()[2]).toBe('/api/v1/jobs?limit=20&status=failed')
    expect(screen.getByRole('button', { name: 'Failed' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('link', { name: 'Reopen Analysis →' })).toHaveLength(1) // pages of the old filter are gone
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    await waitFor(() => expect(listUrls()).toHaveLength(4))
    expect(listUrls()[3]).toBe('/api/v1/jobs?limit=20')
    for (const [name, status] of [['Running', 'running'], ['Completed', 'completed'], ['Cancelled', 'cancelled']]) {
      fireEvent.click(screen.getByRole('button', { name }))
      await waitFor(() => expect(listUrls().at(-1)).toBe(`/api/v1/jobs?limit=20&status=${status}`))
    }
  })

  it('shows the first 140 characters of the content, the scrape url as fallback, and literal text', async () => {
    const long = `<b>${'x'.repeat(200)}</b>`
    route(
      () => page([summary('a'), summary('b'), summary('c')]),
      (id) => json(id === 'a' ? job({ id, input: { content: long } }) : id === 'b' ? job({ id, input: null, scrape: { status: 'running', url: 'https://x.com/alice' } }) : job({ id, input: { content: 'short' } })),
    )
    render(<HistoryView />)
    expect(await screen.findByText('“short”')).toBeInTheDocument()
    expect(screen.getByText('“https://x.com/alice”')).toBeInTheDocument()
    const a = screen.getByText(`“${long.slice(0, 140)}…”`)
    expect(a.querySelector('b')).toBeNull()
  })

  it('shows "Excerpt unavailable" for a failed excerpt request without affecting others', async () => {
    route(() => page([summary('a'), summary('b')]), (id) => (id === 'a' ? json({ error: { code: 'internal_error', message: 'x' } }, 500) : json(job({ id, input: { content: 'fine' } }))))
    render(<HistoryView />)
    expect(await screen.findByText('Excerpt unavailable')).toBeInTheDocument()
    expect(await screen.findByText('“fine”')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('never has more than four excerpt requests in flight', async () => {
    let pending = 0
    let peak = 0
    const release: (() => void)[] = []
    route(
      () => page(Array.from({ length: 10 }, (_, i) => summary(`j${i}`))),
      (id) => {
        pending++
        peak = Math.max(peak, pending)
        return new Promise<Response>((resolve) => release.push(() => { pending--; resolve(json(job({ id, input: { content: id } }))) }))
      },
    )
    render(<HistoryView />)
    await waitFor(() => expect(release).toHaveLength(4))
    expect(pending).toBe(4)
    for (let done = 0; done < 10; done++) {
      await act(async () => release[done]())
      await waitFor(() => expect(release.length).toBe(Math.min(10, done + 5)))
    }
    expect(peak).toBe(4)
    expect(await screen.findByText('“j9”')).toBeInTheDocument()
  })

  describe('queued excerpts', () => {
    // Ten items, so four requests are in flight and six wait; `release` settles the in-flight ones.
    const setup = () => {
      const release: (() => void)[] = []
      route(
        (url) => page(Array.from({ length: url.includes('status=failed') ? 2 : 10 }, (_, i) => summary(`${url.includes('status=failed') ? 'f' : 'j'}${i}`))),
        (id) => new Promise<Response>((resolve) => release.push(() => resolve(json(job({ id, input: { content: id } }))))),
      )
      return release
    }
    const detailUrls = () => fetchMock.mock.calls.map((c) => c[0] as string).filter((u) => !u.includes('?'))

    it('stops fetching queued excerpts after unmount', async () => {
      const release = setup()
      const { unmount } = render(<HistoryView />)
      await waitFor(() => expect(release).toHaveLength(4))
      unmount()
      await act(async () => release.forEach((r) => r()))
      expect(detailUrls()).toHaveLength(4)
    })

    it('drops queued excerpts of a previous filter so the new items load first', async () => {
      const release = setup()
      render(<HistoryView />)
      await waitFor(() => expect(release).toHaveLength(4))
      fireEvent.click(screen.getByRole('button', { name: 'Failed' }))
      await waitFor(() => expect(listUrls()).toHaveLength(2))
      await act(async () => release.slice(0, 4).forEach((r) => r()))
      await waitFor(() => expect(detailUrls()).toHaveLength(6))
      expect(detailUrls().slice(4)).toEqual(['/api/v1/jobs/f0', '/api/v1/jobs/f1'])
    })
  })

  it('shows the empty state with a link to start an analysis', async () => {
    route(() => page([]))
    render(<HistoryView />)
    expect(await screen.findByText('No previous analyses yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start first analysis' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull()
  })

  it('shows an error envelope with role=alert', async () => {
    route(() => json({ error: { code: 'invalid_request', message: 'bad' } }, 400))
    render(<HistoryView />)
    expect(await screen.findByRole('alert')).toHaveTextContent('The request was not valid')
    expect(screen.queryByText('No previous analyses yet')).toBeNull()
  })

  it('marks only the mock parts: search (disabled), export, session text', async () => {
    route(() => page([summary('a')]))
    render(<HistoryView />)
    await screen.findByText('Today')
    const search = screen.getByRole('searchbox', { name: 'Search analyses' })
    expect(search).toBeDisabled()
    for (const el of [search, screen.getByRole('button', { name: /Export Ledger/ }), screen.getByText('Synchronized'), screen.getByText('Workspace session local')])
      expect(inMock(el)).not.toBeNull()
    for (const el of [screen.getByRole('link', { name: 'Reopen Analysis →' }), screen.getByText('Today'), screen.getByRole('button', { name: 'All' })]) expect(inMock(el)).toBeNull()
  })

  describe('locales', () => {
    const Pick = () => {
      const { setLocale } = useLocale()
      return <button type="button" onClick={() => setLocale('de')}>to-de</button>
    }

    it('renders translated headings, filters and links in Arabic with rtl', async () => {
      localStorage.setItem('veil.locale', 'ar')
      route(() => page([summary('a'), summary('b', { created_at: ago(24 * H) })]))
      render(<I18nProvider><HistoryView /></I18nProvider>)
      expect(screen.getByRole('heading', { level: 1, name: 'سجل التحليلات' })).toBeInTheDocument()
      expect(await screen.findByText('اليوم')).toBeInTheDocument()
      expect(screen.getAllByText('أمس')).toHaveLength(2) // the day label and the relative time
      expect(screen.getByRole('button', { name: 'الكل' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getAllByRole('link', { name: 'إعادة فتح التحليل ←' })).toHaveLength(2)
      expect(document.documentElement).toHaveAttribute('dir', 'rtl')
      expect(screen.queryByText('Today')).toBeNull()
    })

    it('translates a skipped finalization status and shows an unknown one as sent', async () => {
      localStorage.setItem('veil.locale', 'de')
      route(() => page([summary('a', { finalization: { status: 'skipped', verdict: null } }), summary('b', { finalization: { status: 'odd', verdict: null } })]))
      render(<I18nProvider><HistoryView /></I18nProvider>)
      expect(await screen.findByText('Abschlussbewertung: übersprungen')).toBeInTheDocument()
      expect(screen.getByText('Abschlussbewertung: odd')).toBeInTheDocument()
    })

    it('re-renders in German after a switch, keeping the loaded items', async () => {
      route(() => page([summary('a'), summary('b', { status: 'running', done: false, finalization: { status: 'pending', verdict: null } })]))
      render(<I18nProvider><Pick /><HistoryView /></I18nProvider>)
      await screen.findByText('Today')
      fireEvent.click(screen.getByText('to-de'))
      expect(screen.getByRole('heading', { level: 1, name: 'Analyseverlauf' })).toBeInTheDocument()
      expect(screen.getByText('Heute')).toBeInTheDocument()
      expect(screen.getByText('Manipulation erkannt')).toBeInTheDocument()
      expect(screen.getByText('Abschlussbewertung: ausstehend')).toBeInTheDocument()
      expect(screen.getByText('läuft')).toHaveClass('status-pill', 'blue')
      expect(screen.getAllByText('vor 1 Stunde')).toHaveLength(2)
      expect(screen.getByText('2 Analysen')).toBeInTheDocument()
      expect(listUrls()).toHaveLength(1) // no reload of the list
    })
  })
})
