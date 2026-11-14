import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HomeView from './HomeView'

const fetchMock = vi.fn()
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  window.history.replaceState(null, '', '/')
})
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const err = (status: number, code: string, message: string, details?: object) => json({ error: { code, message, details } }, status)
const ANALYZERS = [
  { id: 'translation', name: 'Translation', category: 'text', enabled: true, selectable: true },
  { id: 'techniques', name: 'Techniques', category: 'rhetoric', enabled: false, selectable: true },
  { id: 'final_synthesis', name: 'Final synthesis', category: 'verdict', enabled: true, selectable: false },
]
// POST /jobs answers `post`; GET /analyzers answers `analyzers`.
const route = (post: Response = json({ id: 'job 1' }, 201), analyzers: Response = json({ items: ANALYZERS })) =>
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => (url.endsWith('/analyzers') ? analyzers : init?.method === 'POST' ? post : json({})))
const posts = () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')
const body = () => JSON.parse(posts()[0][1].body)
const box = () => screen.getByLabelText('Content to analyze')
const type = (text: string) => fireEvent.change(box(), { target: { value: text } })
const analyze = () => fireEvent.click(screen.getByRole('button', { name: /^Analyze/ }))
const openAdvanced = async () => {
  fireEvent.click(screen.getByRole('button', { name: /Advanced options/ }))
  await screen.findByLabelText(/Translation/)
}

describe('HomeView composer', () => {
  it('sends text as {input:{content}} and navigates to the live view', async () => {
    route()
    render(<HomeView />)
    type('hello')
    analyze()
    await waitFor(() => expect(window.location.pathname).toBe('/jobs/job%201/live'))
    expect(posts()).toHaveLength(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/jobs')
    expect(body()).toEqual({ input: { content: 'hello' } })
  })

  it('sends a link in Social Link mode as {scrape:{url}}', async () => {
    route()
    render(<HomeView />)
    fireEvent.click(screen.getByRole('tab', { name: 'Social Link' }))
    type('https://bsky.app/profile/a/post/1')
    analyze()
    await waitFor(() => expect(posts()).toHaveLength(1))
    expect(body()).toEqual({ scrape: { url: 'https://bsky.app/profile/a/post/1' } })
  })

  it.each(['ftp://x.org/a', 'not a url', `https://x.org/${'a'.repeat(2048)}`])('rejects the invalid link %#', (url) => {
    render(<HomeView />)
    fireEvent.click(screen.getByRole('tab', { name: 'Social Link' }))
    type(url)
    analyze()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the character count and disables Analyze while blank or in flight', async () => {
    let finish: (r: Response) => void = () => {}
    fetchMock.mockImplementation(() => new Promise((r) => (finish = r)))
    render(<HomeView />)
    expect(screen.getByText('0 chars')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Analyze/ })).toBeDisabled()
    type('   ')
    expect(screen.getByText('3 chars')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Analyze/ })).toBeDisabled()
    type('abc')
    expect(screen.getByRole('button', { name: /^Analyze/ })).toBeEnabled()
    analyze()
    await waitFor(() => expect(screen.getByRole('button', { name: /^Analyze/ })).toBeDisabled())
    finish(json({ id: 'j' }, 201))
    await waitFor(() => expect(window.location.pathname).toBe('/jobs/j/live'))
  })

  it.each([{ ctrlKey: true }, { metaKey: true }])('submits once on Enter with %o', async (mods) => {
    route()
    render(<HomeView />)
    type('hello')
    fireEvent.keyDown(box(), { key: 'Enter' })
    expect(posts()).toHaveLength(0)
    fireEvent.keyDown(box(), { key: 'Enter', ...mods })
    await waitFor(() => expect(posts()).toHaveLength(1))
  })

  it('fills the textarea from a sample button', () => {
    render(<HomeView />)
    fireEvent.click(screen.getByRole('button', { name: 'Breaking news rhetoric' }))
    expect(box()).toHaveValue('Breaking: officials scramble as crisis deepens — sources say the public has been kept in the dark for months.')
  })
})

describe('HomeView advanced options', () => {
  it('lists selectable analyzers, all checked, with the disabled hint, and omits analyzers when all are checked', async () => {
    route()
    render(<HomeView />)
    await openAdvanced()
    expect(screen.queryByLabelText(/Final synthesis/)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Translation/)).toBeChecked()
    expect(screen.getByLabelText(/Techniques/)).toBeChecked()
    expect(screen.getByText('disabled')).toBeInTheDocument()
    expect(screen.getByLabelText('Final assessment')).toBeChecked()
    type('hello')
    analyze()
    await waitFor(() => expect(posts()).toHaveLength(1))
    expect(body()).toEqual({ input: { content: 'hello' } })
  })

  it('sends only the checked ids', async () => {
    route()
    render(<HomeView />)
    await openAdvanced()
    fireEvent.click(screen.getByLabelText(/Techniques/))
    type('hello')
    analyze()
    await waitFor(() => expect(posts()).toHaveLength(1))
    expect(body()).toEqual({ input: { content: 'hello' }, analyzers: ['translation'] })
  })

  it('sends options.finalize=false when Final assessment is off', async () => {
    route()
    render(<HomeView />)
    await openAdvanced()
    fireEvent.click(screen.getByLabelText('Final assessment'))
    type('hello')
    analyze()
    await waitFor(() => expect(posts()).toHaveLength(1))
    expect(body()).toEqual({ input: { content: 'hello' }, options: { finalize: false } })
  })

  it('shows the error when the analyzers request fails and sends the job without analyzers', async () => {
    route(json({ id: 'j' }, 201), err(500, 'internal_error', 'boom'))
    render(<HomeView />)
    fireEvent.click(screen.getByRole('button', { name: /Advanced options/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on the server')
    type('hello')
    analyze()
    await waitFor(() => expect(posts()).toHaveLength(1))
    expect(body()).toEqual({ input: { content: 'hello' } })
  })
})

describe('HomeView errors', () => {
  it('lists each field of a 422 validation_failed and keeps the content', async () => {
    route(err(422, 'validation_failed', 'bad', { fields: { 'scrape.url': 'must be http(s)', input: 'exactly one' } }))
    render(<HomeView />)
    type('hello')
    analyze()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Some fields are not valid.')
    expect(screen.getByText('scrape.url: must be http(s)')).toBeInTheDocument()
    expect(screen.getByText('input: exactly one')).toBeInTheDocument()
    expect(box()).toHaveValue('hello')
    expect(window.location.pathname).toBe('/')
    expect(screen.getByRole('button', { name: /^Analyze/ })).toBeEnabled()
  })

  it('shows the 413 copy', async () => {
    route(err(413, 'payload_too_large', 'too big'))
    render(<HomeView />)
    type('x')
    analyze()
    expect(await screen.findByRole('alert')).toHaveTextContent('Content is larger than 1 MiB')
  })

  it('lists the ids of an unknown_analyzer error', async () => {
    route(err(422, 'unknown_analyzer', 'no', { analyzer_ids: ['nope', 'zip'] }))
    render(<HomeView />)
    type('x')
    analyze()
    expect(await screen.findByRole('alert')).toHaveTextContent('nope, zip')
  })
})

describe('HomeView copy and mock marking', () => {
  it('wraps only the mock-only elements in Mock', () => {
    render(<HomeView />)
    const marked = (el: HTMLElement) => el.closest('[data-mock]') !== null
    expect(screen.getByText('Supports Bluesky, Mastodon and web pages')).toBeInTheDocument()
    expect(marked(screen.getByText('Auto-detect (EN, FR, AR, DE, FI)'))).toBe(true)
    for (const title of ['Unbiased Dissection', 'Provenance & Signals']) expect(marked(screen.getByText(title))).toBe(true)
    expect(screen.queryByText('Private by Architecture')).toBeNull()
    expect(marked(screen.getByText('Supports Bluesky, Mastodon and web pages'))).toBe(false)
    expect(marked(screen.getByText('0 chars'))).toBe(false)
    expect(marked(screen.getByRole('button', { name: 'Breaking news rhetoric' }))).toBe(false)
    expect(marked(screen.getByRole('button', { name: /^Analyze/ }))).toBe(false)
  })
})
