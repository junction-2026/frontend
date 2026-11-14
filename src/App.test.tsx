import { act, render, screen } from '@testing-library/react'
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

describe('App health check', () => {
  it('shows the heading on 200 {"status":"ok"} and ignores extra members', async () => {
    reply('{"status":"ok","extra":1}')
    render(<App />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Hello, World!' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/healthz')
    expect(init).toMatchObject({ method: 'GET', headers: { Accept: 'application/json' } })
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('shows a loading status while pending', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    render(<App />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows an alert for HTTP 503', async () => {
    reply('', { status: 503, statusText: 'Service Unavailable' })
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Backend health check failed: HTTP 503 Service Unavailable')
    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.queryByText(/Hello, World!/)).toBeNull()
  })

  it('shows an alert for a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Backend health check failed: Failed to fetch')
    expect(screen.queryByText(/Hello, World!/)).toBeNull()
  })

  it('shows an alert for status "down"', async () => {
    reply('{"status":"down"}')
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent('unexpected response body {"status":"down"}')
    expect(screen.queryByText(/Hello, World!/)).toBeNull()
  })

  it('shows an alert for a non-JSON body, truncated to 200 characters', async () => {
    reply('<html>' + 'x'.repeat(300))
    render(<App />)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('unexpected response body <html>')
    expect(alert.textContent).toHaveLength('Backend health check failed: unexpected response body '.length + 200)
    expect(screen.queryByText(/Hello, World!/)).toBeNull()
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
    expect(screen.getByRole('alert')).toHaveTextContent('timed out after 5000 ms')
    expect(screen.queryByText(/Hello, World!/)).toBeNull()
  })
})
