import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { HEALTH_TIMEOUT_MS } from './health'

const fetchMock = vi.fn()

beforeEach(() => vi.stubGlobal('fetch', fetchMock))
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const reply = (body: string, init: ResponseInit = { status: 200 }) =>
  fetchMock.mockResolvedValue(new Response(body, init))

describe('top bar health indicator', () => {
  it('shows "Backend online" on 200 {"status":"ok"}, ignores extra members and calls /healthz once', async () => {
    reply('{"status":"ok","extra":1}')
    render(<App />)
    expect(await screen.findByText('Backend online')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText('Hello, World!')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/healthz')
    expect(init).toMatchObject({ method: 'GET', headers: { Accept: 'application/json' } })
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('shows a checking status while pending', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    render(<App />)
    expect(screen.getByRole('status')).toHaveTextContent('Checking backend…')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows an alert with the message as tooltip for HTTP 503', async () => {
    reply('', { status: 503, statusText: 'Service Unavailable' })
    render(<App />)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Backend offline')
    expect(alert).toHaveAttribute('title', 'Backend health check failed: HTTP 503 Service Unavailable')
  })

  it('re-words the offline tooltip after a locale switch without a new request', async () => {
    reply('', { status: 503, statusText: 'Service Unavailable' })
    render(<App />)
    await screen.findByRole('alert')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'de' } })
    expect(screen.getByRole('alert')).toHaveAttribute('title', 'Gesundheitsprüfung des Servers fehlgeschlagen: HTTP 503 Service Unavailable')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    localStorage.clear()
  })

  it('shows an alert for a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveAttribute('title', 'Backend health check failed: Failed to fetch')
  })

  it('shows an alert for status "down"', async () => {
    reply('{"status":"down"}')
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveAttribute('title', expect.stringContaining('unexpected response body {"status":"down"}'))
  })

  it('shows an alert for a non-JSON body, truncated to 200 characters', async () => {
    reply('<html>' + 'x'.repeat(300))
    render(<App />)
    const title = (await screen.findByRole('alert')).getAttribute('title')!
    expect(title).toContain('unexpected response body <html>')
    expect(title).toHaveLength('Backend health check failed: unexpected response body '.length + 200)
  })

  it('shows an alert when the request times out', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) =>
          init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))),
        ),
    )
    render(<App />)
    await act(() => vi.advanceTimersByTimeAsync(HEALTH_TIMEOUT_MS))
    expect(screen.getByRole('alert')).toHaveAttribute('title', expect.stringContaining('timed out after 5000 ms'))
  })
})
