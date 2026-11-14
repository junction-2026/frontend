import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

const fetchMock = vi.fn()
beforeEach(() => vi.stubGlobal('fetch', fetchMock))
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  window.history.replaceState(null, '', '/')
})

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const det = (name: string, spans?: unknown[]) => ({
  name,
  display: name.replace('_', ' '),
  explanation: `${name} explained`,
  score: 0.9,
  ...(spans ? { spans } : {}),
})
const span = (technique: string, content: string, text: string, from = 0) => {
  const start = content.indexOf(text, from)
  return { technique, text, start, end: start + text.length }
}
const job = (content: string, result: unknown, extra: object = {}) => ({
  id: 'j1',
  status: 'completed',
  done: true,
  input: { content },
  analyzers: [{ name: 'techniques', status: 'succeeded', result }],
  ...extra,
})
const show = async (j: unknown) => {
  fetchMock.mockResolvedValue(json(j))
  window.history.replaceState(null, '', '/?job=j1')
  render(<App />)
  return screen.findByTestId('job-text')
}
const marks = (el: HTMLElement) => [...el.querySelectorAll('mark')]

describe('job view', () => {
  it('fetches the job, highlights an English sentence span and lists the technique', async () => {
    const c = 'Wake up. They are LYING to you.'
    const text = await show(job(c, { span_status: 'ok', detected: [det('Loaded_Language', [span('Loaded_Language', c, 'They are LYING to you.')])] }))
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/jobs/j1')
    expect(text.textContent).toBe(c)
    expect(marks(text).map((m) => m.textContent)).toEqual(['They are LYING to you.'])
    expect(marks(text)[0]).toHaveAttribute('data-techniques', 'Loaded_Language')
    expect(marks(text)[0]).toHaveAccessibleName(/Loaded Language/)
    expect(screen.getByRole('button', { name: /Loaded Language.*explained.*1 phrase/ })).toBeInTheDocument()
    expect(screen.getByText(/indicators.*not proof/)).toBeInTheDocument()
    expect(screen.queryByText(/0\.9/)).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1) // terminal: no polling
    expect(screen.queryByText(/highlighting unavailable/i)).toBeNull()
  })

  it('lists a non-English technique with empty spans without highlight', async () => {
    const c = 'Sie LÜGEN euch an.'
    const text = await show(job(c, { span_status: 'ok', detected: [det('Doubt', [])] }))
    expect(marks(text)).toHaveLength(0)
    expect(screen.getByRole('button', { name: /Doubt.*no exact phrase found/ })).toBeInTheDocument()
  })

  it('shows a note for span_status timeout', async () => {
    const text = await show(job('abc', { span_status: 'timeout', detected: [det('Doubt', [])] }))
    expect(marks(text)).toHaveLength(0)
    expect(screen.getByText(/highlighting unavailable/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Doubt/ })).toBeInTheDocument()
  })

  it('handles a pre-span result without span members', async () => {
    const text = await show(job('abc', { detected: [det('Doubt')] }))
    expect(marks(text)).toHaveLength(0)
    expect(screen.getByRole('button', { name: /Doubt.*no exact phrase found/ })).toBeInTheDocument()
    expect(screen.queryByText(/highlighting unavailable/i)).toBeNull()
  })

  it('shows "no technique analysis available" for a failed or missing run, and never translation sentences', async () => {
    const c = 'Hallo'
    const text = await show(job(c, null, { analyzers: [{ name: 'techniques', status: 'failed', result: null }] }))
    expect(text.textContent).toBe(c)
    expect(screen.getByText(/no technique analysis available/i)).toBeInTheDocument()
    cleanup()
    await show(job(c, { span_status: 'ok', offsets_in: 'translation', sentences: [{ text: 'TRANSLATED SENTENCE' }], detected: [] }))
    expect(screen.queryByText(/TRANSLATED SENTENCE/)).toBeNull()
    cleanup()
    await show(job(c, null, { analyzers: [] }))
    expect(screen.getByText(/no technique analysis available/i)).toBeInTheDocument()
  })

  it('renders markup and Markdown literally', async () => {
    const c = '<i>They</i> are <script>x</script> **LYING**'
    const text = await show(job(c, { span_status: 'ok', detected: [det('Doubt', [span('Doubt', c, '**LYING**')])] }))
    expect(text.textContent).toBe(c)
    expect(text.querySelector('i, script, strong, b')).toBeNull()
    expect(marks(text).map((m) => m.textContent)).toEqual(['**LYING**'])
    expect(text.children).toHaveLength(1)
  })

  it('uses UTF-16 offsets for emoji and Ü', async () => {
    const c = '😡 Üble They are LYING to you.'
    const s = { technique: 'Doubt', text: 'They are LYING to you.', start: 8, end: 30 }
    expect(c.slice(s.start, s.end)).toBe(s.text)
    const text = await show(job(c, { span_status: 'ok', detected: [det('Doubt', [s])] }))
    expect(marks(text).map((m) => m.textContent)).toEqual([s.text])
    expect(text.textContent).toBe(c)
  })

  it('renders overlapping spans without losing or duplicating characters, and emphasises the selected technique', async () => {
    const c = 'one two three four'
    const a = span('Doubt', c, 'two three')
    const b = span('Loaded_Language', c, 'three four')
    const text = await show(job(c, { span_status: 'ok', detected: [det('Doubt', [a]), det('Loaded_Language', [b])] }))
    expect(text.textContent).toBe(c)
    expect(marks(text).map((m) => [m.textContent, m.getAttribute('data-techniques')])).toEqual([
      ['two ', 'Doubt'],
      ['three', 'Doubt Loaded_Language'],
      [' four', 'Loaded_Language'],
    ])
    const button = screen.getByRole('button', { name: /Doubt/ })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(marks(text).map((m) => m.getAttribute('data-selected'))).toEqual(['true', 'true', null])
    fireEvent.click(button)
    expect(marks(text).every((m) => !m.hasAttribute('data-selected'))).toBe(true)
  })

  it('ignores an invalid span instead of crashing', async () => {
    const c = 'abc def'
    const good = span('Doubt', c, 'def')
    const text = await show(
      job(c, {
        span_status: 'ok',
        detected: [det('Doubt', [{ technique: 'Doubt', text: 'zzz', start: 0, end: 3 }, { technique: 'Doubt', text: 'x', start: 5, end: 99 }, good])],
      }),
    )
    expect(marks(text).map((m) => m.textContent)).toEqual(['def'])
    expect(text.textContent).toBe(c)
  })

  it('polls every 2 s until terminal', async () => {
    vi.useFakeTimers()
    fetchMock
      .mockResolvedValueOnce(json(job('abc', null, { status: 'running', done: false })))
      .mockResolvedValueOnce(json(job('abc', { detected: [] })))
    window.history.replaceState(null, '', '/?job=j1')
    render(<App />)
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(1999))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await act(() => vi.advanceTimersByTimeAsync(10000))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('stops polling on unmount', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(async () => json(job('abc', null, { status: 'running', done: false })))
    window.history.replaceState(null, '', '/?job=j1')
    const { unmount } = render(<App />)
    await act(() => vi.advanceTimersByTimeAsync(0))
    unmount()
    await act(() => vi.advanceTimersByTimeAsync(10000))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shows an alert for 404 and for a network error, without polling', async () => {
    vi.useFakeTimers()
    window.history.replaceState(null, '', '/?job=nope')
    fetchMock.mockResolvedValue(json({ error: { code: 'not_found' } }, 404))
    const { unmount } = render(<App />)
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(screen.getByRole('alert')).toHaveTextContent(/not found/i)
    await act(() => vi.advanceTimersByTimeAsync(10000))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    unmount()
    fetchMock.mockReset()
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<App />)
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch')
    await act(() => vi.advanceTimersByTimeAsync(10000))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('keeps the health page without ?job and when job is empty', async () => {
    fetchMock.mockResolvedValue(json({ status: 'ok' }))
    window.history.replaceState(null, '', '/?job=')
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Hello, World!' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toBe('/healthz')
  })
})
