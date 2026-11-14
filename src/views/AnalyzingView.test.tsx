import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { I18nProvider, useLocale, type Locale } from '../i18n'
import AnalyzingView from './AnalyzingView'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  onmessage: ((m: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  closed = false
  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
  }
  close() {
    this.closed = true
  }
  emit(type: string, seq: number, data: object = {}) {
    act(() => this.onmessage?.({ data: JSON.stringify({ type, job_id: 'j1', seq, emitted_at: 't', data }) }))
  }
  drop() {
    act(() => this.onclose?.())
  }
}
const ws = () => FakeWebSocket.instances[0]

const fetchMock = vi.fn()
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const err = (status: number, code: string, message = 'm') => json({ error: { code, message } }, status)

beforeEach(() => {
  FakeWebSocket.instances = []
  vi.stubGlobal('WebSocket', FakeWebSocket)
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockImplementation(async () => json({ id: 'j1', done: false })) // the one-off existence check
  window.history.replaceState(null, '', '/jobs/j1/live')
})
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  resetLocale()
})

// Renders under the real provider in a given locale (the choice is read from storage like on a reload).
const inLocale = (lng: string, ui: ReactElement) => {
  localStorage.setItem('veil.locale', lng)
  return render(<I18nProvider>{ui}</I18nProvider>)
}
const Switch = ({ to }: { to: Locale }) => {
  const { setLocale } = useLocale()
  return <button onClick={() => setLocale(to)}>switch</button>
}
const resetLocale = () => {
  localStorage.clear()
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
}

const run = (id: string, over: object = {}) => ({
  id, name: `Name ${id}`, category: 'c', depends_on: [], status: 'pending', reason: null, error: null, started_at: null,
  finished_at: null, duration_ms: null, result: null, availability: null, note: null, ...over,
})
const PLAN = [
  { id: 'translation', name: 'Translation', activity_key: 'translation', depends_on: [], phase: 1 },
  { id: 'news_search', name: 'News search', activity_key: 'news_search', depends_on: [], phase: 1 },
  { id: 'fact_check', name: 'Fact check', activity_key: 'fact_check', depends_on: [], phase: 1 },
  { id: 'final_synthesis', name: 'Final synthesis', activity_key: 'finalizer', depends_on: ['*'], phase: 2 },
]
const job = (over: object = {}) => ({
  id: 'j1', status: 'running', done: false, created_at: new Date(Date.now() - 3700).toISOString(), started_at: null, finished_at: null,
  input: { content: 'Everyone knows <b>this</b>' }, scrape: null, options: { finalize: true },
  analyzers: PLAN.slice(0, 3).map((p) => run(p.id)), coverage: {}, finalization: { status: 'pending', result: null, error: null, duration_ms: null, reason: null },
  ...over,
})
const act1 = (key: string, text: string, detail: string | null = null) => ({ key, text, detail, params: {} })
const snapshot = (jobOver: object = {}, extra: object = {}) =>
  ws().emit('job.snapshot', 3, { job: job(jobOver), plan: { analyzers: PLAN, total: 4 }, progress: { done: 0, running: [], total: 4 }, previews: {}, activities: {}, ...extra })
const rowOf = (title: string) => within(document.querySelector('.ledger') as HTMLElement).getByText(title).closest('.ledger-item') as HTMLElement
const mounted = () => render(<AnalyzingView id="j1" />)

describe('AnalyzingView stream', () => {
  it('subscribes on mount and unsubscribes on unmount', () => {
    const { unmount } = mounted()
    expect(ws().url).toMatch(/\/api\/v1\/jobs\/j1\/events$/)
    unmount()
    expect(ws().closed).toBe(true)
  })

  it('shows the banner as plain text with id and client-side elapsed time, Mock only on the fake parts', () => {
    mounted()
    snapshot()
    expect(screen.getByText('Everyone knows <b>this</b>', { selector: 'bdi' })).toBeInTheDocument()
    expect(document.querySelector('.quote-text b')).toBeNull()
    expect(screen.getByText(/Job j1/)).toBeInTheDocument()
    expect(screen.getByText(/Elapsed: 0[34]\.\ds/)).toBeInTheDocument()
    expect(screen.queryByText('Cluster: eu-west-alpha-2')).toBeNull()
    expect(screen.queryByText('Zero-retention ephemeral pipeline')).toBeNull()
    expect(screen.getByText('Synchronous consensus pool').closest('[data-mock]')).not.toBeNull()
    expect(screen.getByText(/Stage 0 of 4 completed/).closest('[data-mock]')).toBeNull()
    expect(screen.queryByText(/worker load|remaining/)).toBeNull()
  })

  it('renders no empty .quote-foot before the job is known', () => {
    mounted()
    expect(document.querySelector('.quote-foot')).toBeNull()
    snapshot()
    expect(document.querySelector('.quote-foot')?.textContent).toMatch(/Elapsed/)
  })

  it('renders the ledger from the snapshot and later events, including failed, timed-out and skipped rows', () => {
    mounted()
    snapshot({}, { activities: { translation: act1('translation', 'Translating the text') } })
    const rows = () => [...document.querySelectorAll('.ledger-item h4')].map((h) => h.textContent)
    expect(rows()).toEqual(['1. Translating the text', '2. News search', '3. Fact check', '4. Final synthesis'])
    expect(within(rowOf('News search')).getByText('Pending')).toBeInTheDocument()

    ws().emit('analyzer.started', 4, { analyzer: run('news_search', { status: 'running' }), activity: act1('news_search', 'Searching news coverage', 'in German and English'), progress: { done: 0, running: ['news_search', 'translation'], total: 4 } })
    expect(within(rowOf('Searching news coverage')).getByText('Running')).toBeInTheDocument()
    expect(rowOf('Searching news coverage')).toHaveTextContent('in German and English')

    ws().emit('analyzer.succeeded', 5, { analyzer: run('translation', { status: 'succeeded', duration_ms: 1234, availability: 'ran' }), preview: { source_language: 'de', translated: true }, progress: { done: 1, running: ['news_search'], total: 4 } })
    const t = rowOf('Translating the text')
    expect(within(t).getByText('Completed')).toBeInTheDocument()
    expect(t).toHaveTextContent('translated from de')
    expect(t).toHaveTextContent('1.2s')

    ws().emit('analyzer.failed', 6, { analyzer: run('news_search', { status: 'failed', error: { code: 'timeout', message: 'slow' }, duration_ms: 5000, note: 'Not available: timed out' }), progress: { done: 2, running: [], total: 4 } })
    const n = rowOf('Searching news coverage')
    expect(within(n).getByText('Timed out')).toBeInTheDocument()
    expect(n).toHaveTextContent('Not available: timed out')

    ws().emit('analyzer.failed', 7, { analyzer: run('fact_check', { status: 'failed', error: { code: 'adapter_error', message: 'x' } }), progress: { done: 3, running: [], total: 4 } })
    expect(within(rowOf('Fact check')).getByText('adapter_error')).toBeInTheDocument()

    ws().emit('analyzer.skipped', 8, { analyzer: run('fact_check', { status: 'skipped', reason: 'not_applicable' }), note: 'Not run: no claims', progress: { done: 3, running: [], total: 4 } })
    // The run object carries the note; the event member alone is not enough, so the row falls back to the reason.
    expect(within(rowOf('Fact check')).getByText('Skipped')).toBeInTheDocument()
    ws().emit('analyzer.skipped', 9, { analyzer: run('fact_check', { status: 'skipped', reason: 'not_applicable', note: 'Not run: no claims' }), progress: { done: 3, running: [], total: 4 } })
    expect(rowOf('Fact check')).toHaveTextContent('Not run: this analyzer does not apply to this kind of input.') // by reason, not the API note

    ws().emit('analysis.finalizing', 10, { finalization: { status: 'running', error: null, duration_ms: null, reason: null }, activity: act1('finalizer', 'Writing the verdict'), progress: { done: 3, running: ['final_synthesis'], total: 4 } })
    expect(within(rowOf('Writing the verdict')).getByText('Running')).toBeInTheDocument()
    ws().emit('analysis.finalization_failed', 11, { finalization: { status: 'failed', error: { code: 'timeout', message: 'x' }, duration_ms: 9000, reason: null }, progress: { done: 4, running: [], total: 4 } })
    expect(within(rowOf('Writing the verdict')).getByText('Timed out')).toBeInTheDocument()
  })

  it('takes progress from the newest event only and ignores out-of-order ones', () => {
    mounted()
    snapshot()
    ws().emit('analyzer.started', 5, { analyzer: run('translation', { status: 'running' }), activity: act1('translation', 'T'), progress: { done: 3, running: [], total: 8 } })
    expect(screen.getByText('Stage 3 of 8 completed')).toBeInTheDocument()
    ws().emit('analyzer.started', 4, { analyzer: run('translation', { status: 'running' }), progress: { done: 2, running: [], total: 8 } })
    expect(screen.getByText('Stage 3 of 8 completed')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '37.5%' })
  })

  it('collapses the ledger with the hide toggle', () => {
    mounted()
    snapshot()
    fireEvent.click(screen.getByRole('button', { name: /Hide progress details/ }))
    expect(document.querySelectorAll('.ledger-item')).toHaveLength(0)
    expect(screen.getByRole('button', { name: /Show progress details/ })).toBeInTheDocument()
  })
})

describe('AnalyzingView scrape jobs', () => {
  const scrapeJob = (scrape: object) => job({ status: 'scraping', input: null, scrape: { status: 'running', url: 'https://x.org/a', ...scrape }, analyzers: [] })

  it('shows the scrape URL and the scrape phase text before the plan', () => {
    mounted()
    ws().emit('job.snapshot', 1, { job: scrapeJob({}), plan: null, progress: null, previews: {}, activities: {} })
    ws().emit('scrape.started', 2, { scrape: { status: 'running', url: 'https://x.org/a' }, activity: act1('scrape', 'Reading the post', 'from x.org') })
    expect(screen.getByText('https://x.org/a', { selector: 'bdi' })).toBeInTheDocument()
    expect(screen.getByText('Fetching the content from x.org')).toBeInTheDocument() // title by key, detail from the API when params are empty
    expect(screen.getByText('Waiting for the plan')).toBeInTheDocument()
  })

  it('shows the failure card with code and message as text, a link to Home and no ledger', () => {
    mounted()
    ws().emit('job.snapshot', 1, { job: scrapeJob({}), plan: null, progress: null, previews: {}, activities: {} })
    ws().emit('scrape.failed', 2, { scrape: { status: 'failed', url: 'https://x.org/a', error: { code: 'account_not_found', message: '<i>No such account</i>' } } })
    expect(screen.getByText('Unable to retrieve social post')).toBeInTheDocument()
    expect(screen.getByText(/account_not_found/)).toBeInTheDocument()
    expect(screen.getByText(/<i>No such account<\/i>/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Switch to Text Input/ })).toHaveAttribute('href', '/')
    expect(document.querySelector('.ledger')).toBeNull()
  })

  it('keeps the failure card when job.failed follows', () => {
    mounted()
    ws().emit('job.snapshot', 1, { job: scrapeJob({}), plan: null, progress: null, previews: {}, activities: {} })
    const failed = job({ status: 'failed', done: true, input: null, analyzers: [], scrape: { status: 'failed', url: 'https://x.org/a', error: { code: 'login_required', message: 'wall' } } })
    ws().emit('job.failed', 2, { job: failed })
    expect(screen.getByText('Unable to retrieve social post')).toBeInTheDocument()
    expect(screen.getByText(/login_required/)).toBeInTheDocument()
  })
})

describe('AnalyzingView terminal states', () => {
  it('replaces the location with the results on job.completed', () => {
    const before = window.history.length
    mounted()
    snapshot()
    ws().emit('job.completed', 4, { job: job({ status: 'completed', done: true }) })
    expect(window.location.pathname).toBe('/jobs/j1')
    expect(window.history.length).toBe(before)
  })

  it('shows Cancelled with the partial runs and a link to the results', () => {
    mounted()
    snapshot()
    const cancelled = job({ status: 'cancelled', done: true, analyzers: [run('translation', { status: 'succeeded', duration_ms: 100 }), run('news_search', { status: 'failed', error: { code: 'cancelled', message: 'c' } }), run('fact_check', { status: 'skipped', reason: 'cancelled' })] })
    ws().emit('job.cancelled', 4, { job: cancelled })
    expect(screen.getByRole('heading', { name: 'Cancelled' })).toBeInTheDocument()
    expect(within(rowOf('Translation')).getByText('Completed')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /partial results/ })).toHaveAttribute('href', '/jobs/j1')
    expect(screen.queryByRole('button', { name: /Cancel analysis/ })).toBeNull()
  })

  it('shows the failure on job.failed', () => {
    mounted()
    snapshot()
    ws().emit('job.failed', 4, { job: job({ status: 'failed', done: true }) })
    expect(screen.getByRole('heading', { name: 'Analysis failed' })).toBeInTheDocument()
  })

  it('shows an alert when the job does not exist', async () => {
    fetchMock.mockResolvedValue(err(404, 'not_found'))
    mounted()
    expect(await screen.findByRole('alert')).toHaveTextContent(/not found/i)
    expect(ws().closed).toBe(true)
  })

  it('falls back to polling every 2000 ms after the reconnects are used up, until done', async () => {
    vi.useFakeTimers()
    const poll = fetchMock
    poll.mockImplementation(async () => json(job({ analyzers: [run('translation', { status: 'succeeded' }), run('news_search')] })))
    mounted()
    await act(() => vi.advanceTimersByTimeAsync(0))
    poll.mockClear()
    for (const wait of [1000, 2000, 4000]) {
      FakeWebSocket.instances.at(-1)!.drop()
      await act(() => vi.advanceTimersByTimeAsync(wait))
    }
    FakeWebSocket.instances.at(-1)!.drop()
    await act(() => vi.advanceTimersByTimeAsync(50)) // the response body resolves asynchronously
    expect(poll).toHaveBeenCalledTimes(1)
    expect(poll.mock.calls[0][0]).toBe('/api/v1/jobs/j1')
    expect(screen.getByText('Stage 1 of 2 completed')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(poll).toHaveBeenCalledTimes(2)
    poll.mockImplementation(async () => json(job({ status: 'completed', done: true })))
    await act(() => vi.advanceTimersByTimeAsync(2050))
    expect(poll).toHaveBeenCalledTimes(3)
    expect(window.location.pathname).toBe('/jobs/j1')
    await act(() => vi.advanceTimersByTimeAsync(10000))
    expect(poll).toHaveBeenCalledTimes(3)
  })
})

describe('AnalyzingView cancel', () => {
  const cancelCalls = () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')
  const click = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Cancel analysis/ }))
    })
  }

  it('posts the cancel, shows Cancelling… on 202 and Cancelled on job.cancelled', async () => {
    mounted()
    snapshot()
    fetchMock.mockResolvedValue(json(job({ status: 'cancelled', done: true }), 202))
    await click()
    expect(cancelCalls()[0][0]).toBe('/api/v1/jobs/j1/cancel')
    expect(screen.getByText('Cancelling…')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/jobs/j1/live')
    ws().emit('job.cancelled', 4, { job: job({ status: 'cancelled', done: true }) })
    expect(screen.queryByText('Cancelling…')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Cancelled' })).toBeInTheDocument()
  })

  it('handles 409 job_finished by saying so and going to the results', async () => {
    mounted()
    snapshot()
    fetchMock.mockResolvedValue(err(409, 'job_finished'))
    await click()
    expect(screen.getByText('The job already finished')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/jobs/j1')
  })

  it('shows an alert for other errors and keeps the button', async () => {
    mounted()
    snapshot()
    fetchMock.mockResolvedValue(err(500, 'internal_error'))
    await click()
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('button', { name: /Cancel analysis/ })).toBeInTheDocument()
  })
})

describe('AnalyzingView in another locale', () => {
  it('renders German chrome, keeps API content unchanged, and re-renders on a language switch', () => {
    inLocale('de', <><Switch to="fr" /><AnalyzingView id="j1" /></>)
    snapshot({ status: 'weird_status' }, { activities: { translation: act1('translation', 'Translating the text') }, progress: { done: 1, running: [], total: 4 } })
    expect(screen.getByRole('heading', { name: 'Ihr Inhalt wird analysiert...' })).toBeInTheDocument()
    expect(screen.getByText(/Auftrag j1/)).toBeInTheDocument()
    expect(screen.getByText('Schritt 1 von 4 abgeschlossen')).toBeInTheDocument()
    expect(screen.getByText('Everyone knows <b>this</b>', { selector: 'bdi' })).toBeInTheDocument()
    expect(screen.getByText('Text wird übersetzt')).toBeInTheDocument() // known key: catalog wording
    expect(within(rowOf('Suche nach Medienberichten')).getByText('Ausstehend')).toBeInTheDocument()
    expect(screen.getByText(/weird_status/)).toBeInTheDocument() // unknown enum value: raw
    fireEvent.click(screen.getByRole('button', { name: 'switch' }))
    expect(screen.getByRole('heading', { name: 'Analyse de votre contenu...' })).toBeInTheDocument()
    expect(screen.getByText('Everyone knows <b>this</b>', { selector: 'bdi' })).toBeInTheDocument()
  })

  it('maps a known job status to the catalog and formats counts and durations per locale', () => {
    inLocale('de', <AnalyzingView id="j1" />)
    snapshot({ status: 'finalizing' })
    expect(screen.getByText(/wird abgeschlossen/)).toBeInTheDocument()
    ws().emit('analyzer.succeeded', 5, { analyzer: run('translation', { status: 'succeeded', duration_ms: 1234 }), preview: { source_language: 'en', translated: true }, progress: { done: 1, running: [], total: 4 } })
    expect(rowOf('Übersetzung')).toHaveTextContent('übersetzt aus en')
    expect(rowOf('Übersetzung')).toHaveTextContent('1,2 s')
  })

  it('translates a cancel error at render, so a language switch re-translates it', async () => {
    inLocale('de', <><Switch to="en" /><AnalyzingView id="j1" /></>)
    snapshot()
    fetchMock.mockImplementation(async () => err(500, 'internal_error'))
    fireEvent.click(screen.getByRole('button', { name: /Analyse abbrechen/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Auf dem Server ist ein Fehler aufgetreten')
    fireEvent.click(screen.getByRole('button', { name: 'switch' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong on the server')
  })
})
