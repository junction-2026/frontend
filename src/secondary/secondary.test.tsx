import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './../App'

const open = (url: string) => {
  window.history.replaceState(null, '', url)
  return render(<App />)
}
const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
const mocked = (el: HTMLElement) => el.closest('[data-mock="true"]')
const analyzer = (o: object) => ({ id: 'a', name: 'A', category: 'c', enabled: true, depends_on: [], trigger: 'on_dependencies_succeeded', selectable: true, ...o })

let fetchMock: ReturnType<typeof vi.fn>
const respond = (analyzers: () => Promise<Response>) => {
  fetchMock = vi.fn((url: string) => (url.endsWith('/analyzers') ? analyzers() : new Promise(() => {})))
  vi.stubGlobal('fetch', fetchMock)
}
beforeEach(() => respond(() => new Promise(() => {})))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

describe('Explore and Region', () => {
  it('keeps Explore unmarked and Region marked as mock, and Clear selection leads back to Explore', () => {
    open('/explore')
    expect(screen.getByRole('heading', { level: 1, name: 'Explore the world.' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'World coverage map' }).closest('.view')!.querySelector('[data-mock]')).toBeNull()
    cleanup()
    open('/explore/region')
    expect(mocked(screen.getByText('99.1%'))).not.toBeNull()
    expect(mocked(screen.getByText('Helsingin Sanomat'))).not.toBeNull()
    expect(mocked(screen.getByText(/Finland Selected/))).not.toBeNull()
    expect(document.querySelector('path[data-code="FI"]')).toHaveAttribute('data-selected', 'true')
    expect(screen.queryByRole('button', { name: 'Zoom in' })).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: 'Clear selection ×' }))
    expect(window.location.pathname).toBe('/explore')
  })
})

describe('Ask', () => {
  it('appends the user bubble locally, marks everything mock and sends no request', () => {
    open('/ask')
    const urls = () => fetchMock.mock.calls.map((c) => String(c[0]))
    const before = urls() // the top-bar health check only
    expect(screen.getByRole('heading', { level: 1, name: /^Ask VEIL/ })).toBeInTheDocument()
    const label = 'Mock data – not connected to the backend (No backend for Ask VEIL)'
    for (const t of [screen.getByText('Why was this flagged as Appeal to Fear?'), screen.getByText(/96% pattern match/), screen.getByText('What other techniques were detected?'), screen.getByLabelText('Message')])
      expect(mocked(t)).toHaveAttribute('title', label)
    fireEvent.click(screen.getByText('What other techniques were detected?'))
    expect(screen.getByLabelText('Message')).toHaveValue('What other techniques were detected?')
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: '  my question ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    const bubble = screen.getByText('my question')
    expect(mocked(bubble)).not.toBeNull()
    expect(screen.getByLabelText('Message')).toHaveValue('')
    fireEvent.click(screen.getByRole('button', { name: 'Send' })) // empty draft: ignored
    expect(screen.getAllByText('my question')).toHaveLength(1)
    expect(urls()).toEqual(before)
    expect(urls().every((u) => u.includes('health'))).toBe(true)
  })
})

describe('States', () => {
  it('is marked "Example states", links to /, /history and /ask and disables Retry', () => {
    open('/states')
    expect(screen.getByRole('heading', { level: 1, name: 'Edge Cases & System States' })).toBeInTheDocument()
    expect(mocked(screen.getByText('Unable to retrieve social post'))).toHaveAttribute('title', expect.stringContaining('Example states'))
    const retry = screen.getByRole('button', { name: /Retry Wire Retrieval/ })
    expect(retry).toBeDisabled()
    expect(retry.closest('[data-mock="true"]')).toHaveAttribute('title', expect.stringContaining('Retry'))
    const main = screen.getByRole('heading', { level: 1 }).closest('section')!
    const hrefs = new Set(within(main).getAllByRole('link').map((a) => a.getAttribute('href')))
    expect(hrefs).toEqual(new Set(['/', '/history', '/ask']))
  })
})

describe('Settings', () => {
  it('marks tabs and the language block as mock with non-functional toggles', async () => {
    open('/settings')
    expect(screen.getByRole('heading', { level: 1, name: 'Settings & Methodology' })).toBeInTheDocument()
    expect(mocked(screen.getByRole('button', { name: 'Data Retention' }))).not.toBeNull()
    expect(mocked(screen.getByText('Interface Language'))).not.toBeNull()
    const sw = screen.getByRole('switch')
    expect(sw).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'true')
    const block = within(screen.getByRole('region', { name: 'Active AI analyzers & ensembles' }))
    expect(block.getByRole('status')).toHaveTextContent('Loading analyzers')
    expect(mocked(block.getByRole('status'))).toBeNull()
  })

  it('lists analyzers from GET /api/v1/analyzers, unmarked and ignoring unknown members', async () => {
    respond(() =>
      json({
        items: [
          analyzer({ id: 'rhetoric', name: 'Rhetoric', category: 'linguistic', extra: 'SECRET-UNKNOWN' }),
          analyzer({ id: 'claims', name: 'Claims', category: 'facts', enabled: false, depends_on: ['rhetoric', 'x'] }),
          analyzer({ id: 'final', name: 'Final synthesis', category: 'finalizer', trigger: 'after_all_analyzers_settled', selectable: false }),
        ],
      }),
    )
    open('/settings')
    const row = (await screen.findByText('Rhetoric')).closest('.analyzer-row') as HTMLElement
    expect(within(row).getByText('rhetoric')).toBeInTheDocument()
    expect(within(row).getByText('Enabled')).toBeInTheDocument()
    expect(within(row).queryByText('Final assessment')).toBeNull()
    expect(row).toHaveTextContent('Category: linguistic')
    expect(row).not.toHaveTextContent('Depends on')
    expect(within(row).queryByText('Not selectable')).toBeNull()
    expect(mocked(row)).toBeNull()
    const claims = screen.getByText('Claims').closest('.analyzer-row') as HTMLElement
    expect(within(claims).getByText('Disabled')).toBeInTheDocument()
    expect(claims).toHaveTextContent('Depends on: rhetoric, x')
    const final = screen.getByText('Final synthesis').closest('.analyzer-row') as HTMLElement
    expect(within(final).getByText('Final assessment')).toBeInTheDocument()
    expect(within(final).getByText('Not selectable')).toBeInTheDocument()
    expect(screen.getByText('● 2 of 3 analyzers enabled')).toBeInTheDocument()
    expect(screen.queryByText(/SECRET-UNKNOWN/)).toBeNull()
    expect(fetchMock.mock.calls.filter((c) => c[0] === '/api/v1/analyzers')).toHaveLength(1)
  })

  it('shows an empty list', async () => {
    respond(() => json({ items: [] }))
    open('/settings')
    expect(await screen.findByText('No analyzers are configured.')).toBeInTheDocument()
    expect(screen.getByText('● 0 of 0 analyzers enabled')).toBeInTheDocument()
  })

  it('shows the error envelope message', async () => {
    respond(() => json({ error: { code: 'scrape_unavailable', message: 'registry down' } }, 503))
    open('/settings')
    const block = within(screen.getByRole('region', { name: 'Active AI analyzers & ensembles' }))
    await waitFor(() => expect(block.getByRole('alert')).toHaveTextContent('registry down'))
    expect(block.queryByRole('status')).toBeNull()
  })
})
