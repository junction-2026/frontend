import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { coverage, json } from '../job/fixtures'
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
const route = (list: (url: string) => Response) => fetchMock.mockImplementation(async (url: string) => list(url))
const listUrls = () => fetchMock.mock.calls.map((c) => c[0] as string).filter((u) => u.startsWith('/api/v1/jobs?'))

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

  it('shows status pill, verdict tag (or the finalization status when null), open-analysis link and no counts', async () => {
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
    expect(screen.getAllByRole('link', { name: 'Open Analysis →' }).map((l) => l.getAttribute('href'))).toEqual(['/jobs/a', '/jobs/b', '/jobs/c'])
    for (const chip of ['All', 'Running', 'Completed', 'Failed', 'Cancelled']) expect(screen.getByRole('button', { name: chip })).toBeInTheDocument()
    expect(screen.queryByText(/\(\d+\)/)).toBeNull()
  })

  it('loads more with the cursor, appends, and hides the button on the last page', async () => {
    route((url) => (url.includes('cursor=c1') ? page([summary('b')], null) : page([summary('a')], 'c1')))
    render(<HistoryView />)
    fireEvent.click(await screen.findByRole('button', { name: 'Load more' }))
    await screen.findByText('b')
    expect(listUrls()[1]).toBe('/api/v1/jobs?limit=20&cursor=c1')
    expect(screen.getAllByRole('link', { name: 'Open Analysis →' })).toHaveLength(2)
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
    expect(screen.getAllByRole('link', { name: 'Open Analysis →' })).toHaveLength(1) // pages of the old filter are gone
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    await waitFor(() => expect(listUrls()).toHaveLength(4))
    expect(listUrls()[3]).toBe('/api/v1/jobs?limit=20')
    for (const [name, status] of [['Running', 'running'], ['Completed', 'completed'], ['Cancelled', 'cancelled']]) {
      fireEvent.click(screen.getByRole('button', { name }))
      await waitFor(() => expect(listUrls().at(-1)).toBe(`/api/v1/jobs?limit=20&status=${status}`))
    }
  })

  it('shows the excerpt of each item cut at 140 characters, as plain text, without per-job requests', async () => {
    const long = `<b>${'x'.repeat(200)}</b>`
    route(() => page([summary('a', { excerpt: long }), summary('b', { excerpt: 'https://x.com/alice' }), summary('c', { excerpt: 'short' }), summary('d', { excerpt: null }), summary('e')]))
    render(<HistoryView />)
    expect(await screen.findByText('“short”')).toBeInTheDocument()
    expect(screen.getByText('“https://x.com/alice”')).toBeInTheDocument()
    expect(screen.getByText(`“${long.slice(0, 140)}…”`).querySelector('b')).toBeNull()
    expect(screen.getAllByText('Excerpt unavailable')).toHaveLength(2) // null and missing
    expect(fetchMock.mock.calls.map((c) => c[0] as string).filter((u) => !u.includes('?'))).toEqual([])
  })

  it('makes the item title a link to the analysis, navigating client-side', async () => {
    route(() => page([summary('a/b', { excerpt: 'short' }), summary('d', { excerpt: null })]))
    render(<HistoryView />)
    await screen.findByText('“short”')
    const [h1, h2] = screen.getAllByRole('heading', { level: 3 })
    const l1 = within(h1).getByRole('link', { name: '“short”' })
    expect(l1).toHaveAttribute('href', '/jobs/a%2Fb')
    expect(within(h2).getByRole('link', { name: 'Excerpt unavailable' })).toHaveAttribute('href', '/jobs/d')
    expect(screen.queryByText(/Reopen/)).toBeNull()
    fireEvent.click(l1)
    expect(window.location.pathname).toBe('/jobs/a%2Fb')
  })

  it('has no meta line and no mock parts', async () => {
    route(() => page([summary('a')]))
    render(<HistoryView />)
    await screen.findByText('Today')
    for (const text of ['Ledger index', 'Workspace session local', 'Synchronized']) expect(screen.queryByText(text)).toBeNull()
    expect(document.querySelector('[data-mock]')).toBeNull()
    expect(screen.getByRole('searchbox', { name: 'Search analyses' })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Export CSV/ })).toBeEnabled()
  })

  describe('search', () => {
    // 25 jobs, only "needle" matches; the unfiltered list is two pages with the match on page 2.
    const needle = summary('needle-job', { excerpt: 'a needle here' })
    const listAll = (url: string) => {
      const u = new URL(url, 'http://x')
      const q = u.searchParams.get('q')
      if (q) return page(q === 'needle' ? [needle] : [])
      return u.searchParams.get('cursor') ? page([needle]) : page([summary('a')], 'c1')
    }
    const type = (value: string) => fireEvent.change(screen.getByRole('searchbox', { name: 'Search analyses' }), { target: { value } })

    it('sends the trimmed text as q 300 ms after the last keystroke, combined with the status, and shows a match from page 2', async () => {
      route(listAll)
      render(<HistoryView />)
      await screen.findByText('Today')
      fireEvent.click(screen.getByRole('button', { name: 'Failed' }))
      await waitFor(() => expect(listUrls()).toHaveLength(2))
      type('nee')
      type('  needle ')
      await new Promise((r) => setTimeout(r, 150))
      expect(listUrls()).toHaveLength(2) // still debouncing
      await screen.findByText('“a needle here”')
      expect(listUrls()).toHaveLength(3)
      expect(listUrls()[2]).toBe('/api/v1/jobs?limit=20&status=failed&q=needle')
      expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull()
    })

    it('sends the query at once on Enter', async () => {
      route(listAll)
      render(<HistoryView />)
      await screen.findByText('Today')
      type('needle')
      fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' })
      await screen.findByText('“a needle here”')
      expect(listUrls()[1]).toBe('/api/v1/jobs?limit=20&q=needle')
    })

    it('loads more with the same q and status, and restores the normal list when cleared', async () => {
      route((url) => (url.includes('cursor=c1') ? page([summary('m2')]) : url.includes('q=') ? page([summary('m1')], 'c1') : page([summary('a')])))
      render(<HistoryView />)
      await screen.findByText('Today')
      fireEvent.click(screen.getByRole('button', { name: 'Completed' }))
      type('m')
      fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' })
      fireEvent.click(await screen.findByRole('button', { name: 'Load more' }))
      await screen.findByText('m2')
      expect(listUrls().at(-1)).toBe('/api/v1/jobs?limit=20&cursor=c1&status=completed&q=m')
      type('   ')
      await waitFor(() => expect(listUrls().at(-1)).toBe('/api/v1/jobs?limit=20&status=completed'))
      await screen.findByText('a')
      expect(screen.queryByText('m1')).toBeNull()
    })

    it('ignores an answer for a previous q', async () => {
      const slow: ((r: Response) => void)[] = []
      fetchMock.mockImplementation((url: string) => (url.includes('q=old') ? new Promise<Response>((resolve) => slow.push(resolve)) : Promise.resolve(url.includes('q=new') ? page([summary('new1')]) : page([]))))
      render(<HistoryView />)
      type('old')
      fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' })
      await waitFor(() => expect(slow).toHaveLength(1))
      type('new')
      fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' })
      await screen.findByText('new1')
      await act(async () => slow[0](page([summary('old1')])))
      expect(screen.queryByText('old1')).toBeNull()
      expect(screen.getByText('new1')).toBeInTheDocument()
    })

    it('shows a distinct empty state with the query as plain text when nothing matches', async () => {
      route(() => page([]))
      render(<HistoryView />)
      await screen.findByText('No previous analyses yet')
      type('<b>zzz</b>')
      fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' })
      const msg = await screen.findByText('No analyses match “<b>zzz</b>”')
      expect(msg.querySelector('b')).toBeNull()
      expect(screen.queryByText('No previous analyses yet')).toBeNull()
      expect(screen.queryByRole('link', { name: 'Start first analysis' })).toBeNull()
    })
  })

  describe('export', () => {
    const files: { name: string; bytes: Uint8Array }[] = []
    const read = (blob: Blob) => new Promise<Uint8Array>((resolve) => { const fr = new FileReader(); fr.onload = () => resolve(new Uint8Array(fr.result as ArrayBuffer)); fr.readAsArrayBuffer(blob) })
    beforeEach(() => {
      files.length = 0
      const blobs: Blob[] = []
      URL.createObjectURL = vi.fn((b: Blob) => { blobs.push(b); return 'blob:x' })
      URL.revokeObjectURL = vi.fn()
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        void read(blobs.at(-1) as Blob).then((bytes) => files.push({ name: this.download, bytes }))
      })
    })
    const text = (i = 0) => new TextDecoder('utf-8', { ignoreBOM: true }).decode(files[i].bytes)
    const click = () => fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }))

    it('pages with limit 100 through every page and downloads one CSV with BOM, CRLF and RFC 4180 quoting', async () => {
      route((url) => (url.includes('cursor=c2')
        ? page([summary('c', { finalization: { status: 'failed', verdict: null }, excerpt: null })])
        : url.includes('cursor=c1') ? page([summary('b', { excerpt: 'say "hi", ok\nbye' })], 'c2') : page([summary('a', { excerpt: 'plain' })], 'c1')))
      render(<HistoryView />)
      await screen.findByText('Today')
      fireEvent.click(screen.getByRole('button', { name: 'Completed' }))
      await waitFor(() => expect(listUrls()).toHaveLength(2))
      click()
      await waitFor(() => expect(files).toHaveLength(1))
      expect(listUrls().slice(2)).toEqual(['/api/v1/jobs?limit=100&status=completed', '/api/v1/jobs?limit=100&cursor=c1&status=completed', '/api/v1/jobs?limit=100&cursor=c2&status=completed'])
      expect([...files[0].bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
      expect(files[0].name).toBe('history-2026-11-14.csv')
      const iso = ago(H)
      expect(text()).toBe(
        '﻿id,created_at,status,finalization_status,verdict,excerpt\r\n' +
        `a,${iso},completed,completed,detected,plain\r\n` +
        `b,${iso},completed,completed,detected,"say ""hi"", ok\nbye"\r\n` +
        `c,${iso},completed,failed,,\r\n`)
    })

    it('uses the active search and neutralises spreadsheet formulas', async () => {
      route((url) => (url.includes('q=x') ? page([summary('a', { excerpt: '=SUM(A1)' }), summary('b', { excerpt: '+1' }), summary('c', { excerpt: '-1' }), summary('d', { excerpt: '@x' }), summary('e', { excerpt: '\tx' }), summary('f', { excerpt: '\rx' }), summary('g', { excerpt: 'a=b' })]) : page([])))
      render(<HistoryView />)
      await screen.findByText('No previous analyses yet')
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'x' } })
      fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' })
      await screen.findByText('“=SUM(A1)”')
      click()
      await waitFor(() => expect(files).toHaveLength(1))
      expect(listUrls().at(-1)).toBe('/api/v1/jobs?limit=100&q=x')
      const cells = text().split('\r\n').slice(1, 8).map((l) => l.split(',').slice(5).join(','))
      expect(cells).toEqual(["'=SUM(A1)", "'+1", "'-1", "'@x", "'\tx", '"\'\rx"', 'a=b']) // the CR cell is also quoted (RFC 4180)
    })

    it('shows the busy state while exporting, with the hint on the button', async () => {
      let release!: () => void
      route((url) => (url.includes('limit=100') ? (new Promise((r) => { release = () => r(page([])) }) as unknown as Response) : page([summary('a')])))
      render(<HistoryView />)
      await screen.findByText('Today')
      expect(screen.getByRole('button', { name: /Export CSV/ })).toHaveAttribute('title', 'Exports every analysis matching the active status filter and search as a CSV file.')
      click()
      const busy = await screen.findByRole('button', { name: 'Exporting…' })
      expect(busy).toBeDisabled()
      expect(busy).toHaveAttribute('aria-busy', 'true')
      await act(async () => release())
      await waitFor(() => expect(screen.getByRole('button', { name: /Export CSV/ })).toBeEnabled())
      await waitFor(() => expect(files).toHaveLength(1)) // let the download settle before the next test
    })

    it('downloads a header-only file for an empty history', async () => {
      route(() => page([]))
      render(<HistoryView />)
      await screen.findByText('No previous analyses yet')
      click()
      await waitFor(() => expect(files).toHaveLength(1))
      expect(text()).toBe('﻿id,created_at,status,finalization_status,verdict,excerpt\r\n')
    })

    it('shows the localized API error and downloads nothing when a page fails', async () => {
      route((url) => (url.includes('cursor=c1') ? json({ error: { code: 'invalid_request', message: 'bad' } }, 400) : url.includes('limit=100') ? page([summary('a')], 'c1') : page([summary('a')])))
      render(<HistoryView />)
      await screen.findByText('Today')
      click()
      expect(await screen.findByRole('alert')).toHaveTextContent('The request was not valid')
      expect(files).toHaveLength(0)
      expect(screen.getByRole('button', { name: /Export CSV/ })).toBeEnabled()
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
      expect(screen.getAllByRole('link', { name: 'فتح التحليل ←' })).toHaveLength(2)
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
