import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HomeView from './HomeView'
import { CATALOGS } from '../i18n/translate'

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
  { id: 'translation', name: 'Translation', category: 'text', enabled: true, selectable: true, extra: 'SECRET-UNKNOWN' },
  { id: 'techniques', name: 'Techniques', category: 'rhetoric', enabled: false, selectable: true, depends_on: ['translation', 'x'] },
  { id: 'language', name: 'Language', category: 'text', enabled: true, selectable: false, depends_on: 'oops' },
  { id: 'final_synthesis', name: 'Final synthesis', category: 'verdict', enabled: true, selectable: false, trigger: 'after_all_analyzers_settled' },
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

  it('renders four samples in order and springfield fills the exact quote', () => {
    render(<HomeView />)
    const labels = ['Viral social claim on energy grid', 'Breaking news rhetoric', 'Editorial framing comparison', 'Political rhetoric: Trump on Springfield (quote)']
    const btns = labels.map((name) => screen.getByRole('button', { name }))
    expect(btns[0].compareDocumentPosition(btns[3]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(btns[3])
    expect(box()).toHaveValue(CATALOGS.en['home.sample.springfield.text'])
    expect(box()).toHaveValue("In Springfield, they're eating the dogs. The people that came in, they're eating the cats. They're eating the pets of the people that live there. And this is what's happening in our country, and it's a shame.")
  })

  it('has no Latin letters in the ar springfield label', () => {
    expect(CATALOGS.ar['home.sample.springfield.label']).not.toMatch(/\p{Script=Latin}/u)
  })

  it('keeps the springfield quote identical in every locale', () => {
    for (const c of Object.values(CATALOGS)) expect(c['home.sample.springfield.text']).toBe(CATALOGS.en['home.sample.springfield.text'])
  })
})

describe('HomeView advanced options', () => {
  const row = (name: string) => screen.getByText(name).closest('.advanced-row') as HTMLElement

  it('lists every item in response order with name, id, category, dependencies and state', async () => {
    route()
    render(<HomeView />)
    await openAdvanced()
    const rows = [...document.querySelectorAll('.advanced-row')]
    expect(rows.map((r) => r.querySelector('label')!.textContent)).toEqual(['Translation', 'Techniques', 'Language', 'Final synthesis'])
    const tech = within(row('Techniques'))
    expect(tech.getByText('techniques').closest('bdi')).not.toBeNull()
    expect(tech.getByText('techniques').closest('.id-badge')).not.toBeNull()
    expect(tech.getByText('rhetoric').closest('bdi')).not.toBeNull()
    expect(tech.getByText('translation, x').closest('bdi')).not.toBeNull()
    expect(row('Techniques')).toHaveTextContent('Depends on: translation, x')
    expect(tech.getByText('Disabled')).toBeInTheDocument()
    expect(within(row('Translation')).getByText('Enabled')).toBeInTheDocument()
    expect(row('Translation')).not.toHaveTextContent('Depends on')
    expect(row('Language')).not.toHaveTextContent('Depends on') // a non-array depends_on counts as empty
    expect(screen.queryByText('disabled')).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('SECRET-UNKNOWN')
  })

  it('counts enabled over all items in the header', async () => {
    route()
    render(<HomeView />)
    await openAdvanced()
    expect(screen.getByText('3 of 4 analyzers enabled')).toBeInTheDocument()
  })

  it('shows an empty list', async () => {
    route(undefined, json({ items: [] }))
    render(<HomeView />)
    fireEvent.click(screen.getByRole('button', { name: /Advanced options/ }))
    expect(await screen.findByText('No analyzers are configured.')).toBeInTheDocument()
    expect(screen.getByText('0 of 0 analyzers enabled')).toBeInTheDocument()
  })

  it('shows the loading status while the list is pending', () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    render(<HomeView />)
    fireEvent.click(screen.getByRole('button', { name: /Advanced options/ }))
    expect(screen.getByRole('status')).toHaveTextContent('Loading analyzers…')
  })

  it('renders non-selectable rows checked, disabled and Always on, the finalizer also tagged', async () => {
    route()
    render(<HomeView />)
    await openAdvanced()
    for (const name of ['Language', 'Final synthesis']) {
      const box = within(row(name)).getByRole('checkbox')
      expect(box).toBeChecked()
      expect(box).toBeDisabled()
      expect(document.getElementById(box.getAttribute('aria-describedby')!)).toHaveTextContent('Always on')
      fireEvent.click(box)
      expect(box).toBeChecked()
    }
    expect(within(row('Final synthesis')).getByText('Final assessment')).toBeInTheDocument()
    expect(within(row('Language')).queryByText('Final assessment')).not.toBeInTheDocument()
    expect(within(row('Translation')).getByRole('checkbox')).toBeEnabled()
    expect(within(row('Translation')).queryByText('Always on')).not.toBeInTheDocument()
  })

  it('omits analyzers when every selectable item is checked', async () => {
    route()
    render(<HomeView />)
    await openAdvanced()
    type('hello')
    analyze()
    await waitFor(() => expect(posts()).toHaveLength(1))
    expect(body()).toEqual({ input: { content: 'hello' } })
  })

  it('sends only the checked selectable ids, never a non-selectable id or options', async () => {
    route()
    render(<HomeView />)
    await openAdvanced()
    fireEvent.click(screen.getByLabelText(/Techniques/))
    type('hello')
    analyze()
    await waitFor(() => expect(posts()).toHaveLength(1))
    expect(body()).toEqual({ input: { content: 'hello' }, analyzers: ['translation'] })
    expect(body()).not.toHaveProperty('options')
  })

  it('sends [] when every selectable item is unchecked', async () => {
    route()
    render(<HomeView />)
    await openAdvanced()
    fireEvent.click(screen.getByLabelText(/Translation/))
    fireEvent.click(screen.getByLabelText(/Techniques/))
    type('hello')
    analyze()
    await waitFor(() => expect(posts()).toHaveLength(1))
    expect(body()).toEqual({ input: { content: 'hello' }, analyzers: [] })
  })

  it('omits options in link mode', async () => {
    route()
    render(<HomeView />)
    fireEvent.click(screen.getByRole('tab', { name: 'Social Link' }))
    type('https://x.org/a')
    analyze()
    await waitFor(() => expect(posts()).toHaveLength(1))
    expect(body()).toEqual({ scrape: { url: 'https://x.org/a' } })
  })

  it('shows the error when the analyzers request fails and sends the job without analyzers', async () => {
    route(json({ id: 'j' }, 201), err(500, 'internal_error', 'boom'))
    render(<HomeView />)
    fireEvent.click(screen.getByRole('button', { name: /Advanced options/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on the server')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    type('hello')
    analyze()
    await waitFor(() => expect(posts()).toHaveLength(1))
    expect(body()).toEqual({ input: { content: 'hello' } })
  })
})

describe('HomeView visibility switch', () => {
  const sw = () => screen.getByRole('switch', { name: 'Public' })

  it('is on by default, described by the hint, and the hint never says private or secret', () => {
    render(<HomeView />)
    expect(sw()).toHaveAttribute('aria-checked', 'true')
    const hint = document.getElementById(sw().getAttribute('aria-describedby')!)!
    expect(hint).toHaveTextContent(/not public are not shown in History.*anyone with the link/)
    expect(hint.textContent).not.toMatch(/private|secret/i)
  })

  it('toggles on click and is a native focusable button (Space and Enter activate it)', () => {
    render(<HomeView />)
    fireEvent.click(sw())
    expect(sw()).toHaveAttribute('aria-checked', 'false')
    expect(sw().tagName).toBe('BUTTON') // native buttons fire click on Space and Enter
    expect(sw()).toHaveAttribute('type', 'button')
    fireEvent.click(sw())
    expect(sw()).toHaveAttribute('aria-checked', 'true')
  })

  it.each([
    ['text', 'hello', { input: { content: 'hello' } }],
    ['link', 'https://bsky.app/profile/a/post/1', { scrape: { url: 'https://bsky.app/profile/a/post/1' } }],
  ])('%s: omits public when on, sends public:false when off, and navigates both times', async (mode, value, expected) => {
    for (const off of [false, true]) {
      fetchMock.mockReset()
      route()
      const { unmount } = render(<HomeView />)
      if (mode === 'link') fireEvent.click(screen.getByRole('tab', { name: 'Social Link' }))
      if (off) fireEvent.click(sw())
      type(value)
      analyze()
      await waitFor(() => expect(window.location.pathname).toBe('/jobs/job%201/live'))
      expect(body()).toEqual(off ? { ...expected, public: false } : expected)
      window.history.replaceState(null, '', '/')
      unmount()
    }
  })

  it('resets to public after a successful submission and on a fresh visit', async () => {
    route()
    const { unmount } = render(<HomeView />)
    fireEvent.click(sw())
    type('hello')
    analyze()
    await waitFor(() => expect(sw()).toHaveAttribute('aria-checked', 'true'))
    fireEvent.click(sw())
    unmount()
    render(<HomeView />)
    expect(sw()).toHaveAttribute('aria-checked', 'true')
  })

  it('stays off after a failed submission so the user can retry', async () => {
    route(err(500, 'internal_error', 'x'))
    render(<HomeView />)
    fireEvent.click(sw())
    type('hello')
    analyze()
    await screen.findByRole('alert')
    expect(sw()).toHaveAttribute('aria-checked', 'false')
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
    const { container } = render(<HomeView />)
    const marked = (el: HTMLElement) => el.closest('[data-mock]') !== null
    expect(screen.getByText('Supports Bluesky, Mastodon and web pages')).toBeInTheDocument()
    expect(screen.queryByText(/Auto-detect/)).toBeNull()
    expect(screen.queryByText('Unbiased Dissection')).toBeNull()
    expect(screen.queryByText('Provenance & Signals')).toBeNull()
    expect(container.querySelector('.feature-grid')).toBeNull()
    expect(screen.queryByText('Private by Architecture')).toBeNull()
    expect(marked(screen.getByText('Supports Bluesky, Mastodon and web pages'))).toBe(false)
    expect(marked(screen.getByText('0 chars'))).toBe(false)
    expect(marked(screen.getByRole('button', { name: 'Breaking news rhetoric' }))).toBe(false)
    expect(marked(screen.getByRole('button', { name: /^Analyze/ }))).toBe(false)
  })
})
