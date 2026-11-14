import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../i18n'
import { job, json } from '../job/fixtures'
import AskView from './AskView'

const fetchMock = vi.fn()
const reply = (content: string, extra: Record<string, unknown> = {}) =>
  json({ job_id: 'j1', message: { role: 'assistant', content }, history_truncated: false, created_at: '2026-11-14T10:00:00Z', ...extra })
const err = (status: number, code: string, details?: Record<string, unknown>) => json({ error: { code, message: `server says ${code}`, ...(details ? { details } : {}) } }, status)

let jobBody: unknown
let chat: (body: { messages: unknown[]; language: string }) => Response | Promise<Response>
beforeEach(() => {
  jobBody = job()
  chat = () => reply('An answer.')
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/chat')) return chat(JSON.parse(String(init?.body)))
    return json(jobBody)
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  localStorage.clear()
  sessionStorage.clear()
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
})

const show = async (id = 'j1', locale = 'en') => {
  localStorage.setItem('veil.locale', locale)
  render(<I18nProvider><AskView id={id} /></I18nProvider>)
  return screen.findByRole('textbox')
}
const chats = () => fetchMock.mock.calls.filter((c) => String(c[0]).endsWith('/chat')).map((c) => ({ url: String(c[0]), init: c[1] as RequestInit, body: JSON.parse(String(c[1].body)) }))
const ask = async (text: string) => {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: text } })
  fireEvent.click(screen.getByRole('button', { name: 'Send' }))
}

describe('without a job', () => {
  it('asks to pick an analysis, links to /history and has no composer', () => {
    localStorage.setItem('veil.locale', 'en')
    render(<I18nProvider><AskView id="" /></I18nProvider>)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ask VEIL')
    expect(screen.getByText('Choose an analysis to ask about')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open history/ })).toHaveAttribute('href', '/history')
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('context bar and states', () => {
  it('names the job (verdict, input, link back) outside any Mock', async () => {
    await show()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/jobs/j1')
    expect(screen.getByText('Manipulation detected')).toBeInTheDocument()
    expect(screen.getByText('Everyone knows these people are destroying our future.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to summary/ })).toHaveAttribute('href', '/jobs/j1')
    expect(document.querySelector('[data-mock]')).toBeNull()
    expect(document.body.textContent).not.toMatch(/No backend for Ask VEIL/)
  })

  it('prefers the source title', async () => {
    jobBody = job({ input: { content: 'body', source: { title: 'A headline' } } })
    await show()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('A headline')
  })

  it('shows a not-found state for an unknown job', async () => {
    jobBody = null
    fetchMock.mockImplementation(async () => err(404, 'not_found'))
    localStorage.setItem('veil.locale', 'en')
    render(<I18nProvider><AskView id="nope" /></I18nProvider>)
    expect(await screen.findByRole('alert')).toHaveTextContent('Job not found')
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it.each([['queued'], ['running']])('disables the composer for a %s job', async (status) => {
    jobBody = job({ status, done: false })
    await show()
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
    expect(screen.getByText('VEIL can answer once the analysis has finished.')).toBeInTheDocument()
    expect(screen.queryByText('What other techniques were detected?')).toBeNull()
  })

  it.each([['failed'], ['cancelled']])('disables the composer for a %s job with its own text', async (status) => {
    jobBody = job({ status, done: true })
    await show()
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByText('This analysis did not finish, so there is nothing to ask about.')).toBeInTheDocument()
  })
})

describe('chatting', () => {
  it('sends the question with the language and shows the reply, then sends the earlier turns with a follow-up', async () => {
    await show('j1', 'de')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Warum?  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Senden' }))
    expect(await screen.findByText('An answer.')).toBeInTheDocument()
    expect(chats()[0].url).toBe('/api/v1/jobs/j1/chat')
    expect(chats()[0].init.method).toBe('POST')
    expect(chats()[0].body).toEqual({ messages: [{ role: 'user', content: 'Warum?' }], language: 'de' })
    expect(screen.getByRole('textbox')).toHaveValue('')
    chat = () => reply('Second.')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Und weiter?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Senden' }))
    expect(await screen.findByText('Second.')).toBeInTheDocument()
    expect(chats()[1].body.messages).toEqual([
      { role: 'user', content: 'Warum?' }, { role: 'assistant', content: 'An answer.' }, { role: 'user', content: 'Und weiter?' },
    ])
    expect([...document.querySelectorAll('.bubble-user, .bubble-ai')].map((e) => e.textContent?.replace(/^V/, ''))).toEqual(['Warum?', 'An answer.', 'Und weiter?', 'Second.'])
  })

  it('keeps the page when scrollIntoView returns a Promise (Chromium scroll promises)', async () => {
    // a returned Promise must not become the auto-scroll effect's cleanup, or React throws on the next send
    const original = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = (() => Promise.resolve()) as unknown as typeof original
    try {
      const box = await show()
      fireEvent.change(box, { target: { value: 'first' } })
      fireEvent.keyDown(box, { key: 'Enter' })
      expect(await screen.findByText('An answer.')).toBeInTheDocument()
      chat = () => reply('Second.')
      fireEvent.change(box, { target: { value: 'second' } })
      fireEvent.keyDown(box, { key: 'Enter' })
      expect(await screen.findByText('Second.')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    } finally {
      Element.prototype.scrollIntoView = original
    }
  })

  it('sends on Enter, adds a line on Shift+Enter and never sends a blank question', async () => {
    const box = await show()
    fireEvent.change(box, { target: { value: 'line one' } })
    fireEvent.keyDown(box, { key: 'Enter', shiftKey: true })
    expect(chats()).toHaveLength(0)
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(await screen.findByText('An answer.')).toBeInTheDocument()
    expect(chats()).toHaveLength(1)
    fireEvent.change(box, { target: { value: '   ' } })
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(chats()).toHaveLength(1)
  })

  it('limits the question to 2000 code points and counts them', async () => {
    const box = await show()
    fireEvent.change(box, { target: { value: '😀'.repeat(2500) } })
    expect(Array.from((box as HTMLTextAreaElement).value)).toHaveLength(2000)
    expect(document.querySelector('.chat-count')).toHaveTextContent('2,000 / 2,000')
  })

  it('shows the starter questions only for an empty thread, and a click sends one', async () => {
    await show()
    fireEvent.click(screen.getByText('What other techniques were detected?'))
    expect(await screen.findByText('An answer.')).toBeInTheDocument()
    expect(chats()[0].body.messages).toEqual([{ role: 'user', content: 'What other techniques were detected?' }])
    expect(screen.queryByText('What evidence contradicts this claim?')).toBeNull()
  })

  it('waits with a polite "thinking" status and disables Send', async () => {
    let finish: (r: Response) => void = () => {}
    chat = () => new Promise<Response>((r) => { finish = r })
    await show()
    await ask('hi')
    const status = await screen.findByText('VEIL is thinking…')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
    await act(async () => finish(await reply('done')))
    expect(await screen.findByText('done')).toBeInTheDocument()
    expect(screen.queryByText('VEIL is thinking…')).toBeNull()
  })

  it('sends at most the latest 40 messages and never starts with an assistant message last', async () => {
    const old = Array.from({ length: 50 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }))
    sessionStorage.setItem('veil.ask.j1', JSON.stringify(old))
    await show()
    await ask('newest')
    await screen.findByText('An answer.')
    const sent = chats()[0].body.messages as { role: string; content: string }[]
    expect(sent).toHaveLength(40)
    expect(sent.at(-1)).toEqual({ role: 'user', content: 'newest' })
    expect(sent[0].content).toBe('m11')
  })

  it('notes that older messages are no longer used after history_truncated', async () => {
    chat = () => reply('ok', { history_truncated: true })
    await show()
    await ask('q')
    expect(await screen.findByText('Older messages are no longer used for answers.')).toBeInTheDocument()
  })

  it('keeps the thread per job in sessionStorage', async () => {
    await show()
    await ask('remember me')
    await screen.findByText('An answer.')
    cleanup()
    await show()
    expect(screen.getByText('remember me')).toBeInTheDocument()
    expect(screen.getByText('An answer.')).toBeInTheDocument()
    cleanup()
    jobBody = job({ id: 'j2' })
    await show('j2')
    expect(screen.queryByText('remember me')).toBeNull()
  })
})

describe('plain-text rendering', () => {
  it('shows markup and links literally with the line breaks kept', async () => {
    const text = '<img src=x onerror=alert(1)>\n[click](https://example.com) <b>bold</b>'
    chat = () => reply(text)
    await show()
    await ask('q')
    const p = await screen.findByText((_, el) => el?.tagName === 'P' && el.textContent === text)
    expect(p).toHaveAttribute('dir', 'auto')
    expect(document.querySelector('.chat-thread img, .chat-thread a, .chat-thread b')).toBeNull()
  })
})

describe('errors', () => {
  it('shows a 409 conflict as a disabled composer and keeps the question', async () => {
    chat = () => err(409, 'job_not_completed', { status: 'failed' })
    await show()
    await ask('why?')
    expect(await screen.findByText('This analysis did not finish, so there is nothing to ask about.')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByText('why?')).toBeInTheDocument()
  })

  it('shows 503 chat_unavailable with Retry, which resends the same request', async () => {
    chat = () => err(503, 'chat_unavailable')
    await show()
    await ask('why?')
    expect(await screen.findByRole('alert')).toHaveTextContent('VEIL is not available right now. Please try again.')
    expect(screen.getByText('why?')).toBeInTheDocument()
    chat = () => reply('now it works')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('now it works')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(chats()).toHaveLength(2)
    expect(chats()[1].body).toEqual(chats()[0].body)
  })

  it('shows 504 chat_timeout and a network failure', async () => {
    chat = () => err(504, 'chat_timeout')
    await show()
    await ask('a')
    expect(await screen.findByRole('alert')).toHaveTextContent('VEIL took too long to answer. Please try again.')
    chat = () => { throw new TypeError('offline') }
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the backend'))
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('shows the wait time of a 429', async () => {
    chat = () => err(429, 'rate_limited', { retry_after_s: 7 })
    await show()
    await ask('a')
    expect(await screen.findByRole('alert')).toHaveTextContent('Please wait 7 seconds')
  })

  it('shows an Ask-specific text for validation_failed', async () => {
    chat = () => err(422, 'validation_failed', { fields: { 'messages[0].content': 'too long' } })
    await show()
    await ask('a')
    expect(await screen.findByRole('alert')).toHaveTextContent('This question could not be sent')
  })

  it('gives up after 125 seconds with a timeout error and Retry', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    chat = () => new Promise<Response>(() => {})
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (!url.endsWith('/chat')) return Promise.resolve(json(jobBody))
      return new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))
    })
    await show()
    await ask('slow')
    await act(async () => { vi.advanceTimersByTime(124_000) })
    expect(screen.queryByRole('alert')).toBeNull()
    await act(async () => { vi.advanceTimersByTime(1_500) })
    expect(await screen.findByRole('alert')).toHaveTextContent('No answer arrived in time')
    expect(screen.getByText('slow')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('offers Retry for a restored thread that ends with a question', async () => {
    sessionStorage.setItem('veil.ask.j1', JSON.stringify([{ role: 'user', content: 'unanswered' }]))
    await show()
    expect(screen.getByText('unanswered')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('An answer.')).toBeInTheDocument()
    expect(chats()[0].body.messages).toEqual([{ role: 'user', content: 'unanswered' }])
  })
})
