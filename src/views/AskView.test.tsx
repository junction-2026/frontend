import { readFileSync } from 'node:fs'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { richJob } from '../ask/askFixtures'
import { I18nProvider } from '../i18n'
import { translate } from '../i18n/translate'
import { job, json, risk, run } from '../job/fixtures'
import AskView from './AskView'
import ResultsView from './ResultsView'

const fetchMock = vi.fn()
const reply = (content: string, extra: Record<string, unknown> = {}) =>
  json({ job_id: 'j1', message: { role: 'assistant', content }, history_truncated: false, created_at: '2026-11-14T10:00:00Z', ...extra })
const err = (status: number, code: string, details?: Record<string, unknown>) => json({ error: { code, message: `server says ${code}`, ...(details ? { details } : {}) } }, status)

let jobBody: unknown
let chat: (body: { messages: unknown[]; language: string; focus?: unknown[] }) => Response | Promise<Response>
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
    const bar = within(document.querySelector('.context-bar') as HTMLElement) // the result pane shows the same verdict label and excerpt
    expect(bar.getByText('Manipulation detected')).toBeInTheDocument()
    expect(bar.getByText('Everyone knows these people are destroying our future.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to summary/ })).toHaveAttribute('href', '/jobs/j1')
    expect(document.querySelector('[data-mock]')).toBeNull()
    expect(document.body.textContent).not.toMatch(/No backend for Ask VEIL/)
  })

  it('prefers the source title', async () => {
    jobBody = job({ input: { content: 'body', source: { title: 'A headline' } } })
    await show()
    expect(within(document.querySelector('.context-bar') as HTMLElement).getByRole('heading', { level: 3 })).toHaveTextContent('A headline')
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
    fireEvent.click(screen.getByRole('checkbox', { name: 'Alle auswählen' })) // the default selection would add focus
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

describe('result pane', () => {
  const css = readFileSync('src/ask/ask.css', 'utf8')
  const pane = () => screen.getByRole('region', { name: 'Result elements to ask about' })
  const toggle = (label: string) => screen.getByRole('button', { name: `Ask about ${label}` }) as HTMLButtonElement
  const toggles = () => screen.queryAllByRole('button', { name: /^Ask about / })
  const selectAll = () => screen.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement
  const showNone = async (id = 'j1', locale = 'en') => { // the default selects everything; most tests start from nothing
    const box = await show(id, locale)
    fireEvent.click(selectAll())
    return box
  }
  const terms = (n: number) => richJob({ analyzers: [run('term_context', 'succeeded', { result: { terms: Array.from({ length: n }, (_, i) => ({ term: `term ${i}` })) } })] })
  const pressed = () => toggles().filter((b) => b.getAttribute('aria-pressed') === 'true')
  beforeEach(() => { jobBody = richJob() })

  it('puts the chat first and the result pane second in a logical two-column grid with a 960px breakpoint', async () => {
    await show()
    const split = document.querySelector('.ask-split') as HTMLElement
    expect([...split.children].map((c) => c.className)).toEqual(['ask-chat', 'ask-result'])
    expect(split.children[0].querySelector('textarea')).not.toBeNull()
    expect(pane()).toBe(split.children[1])
    expect(within(pane()).getAllByRole('heading', { level: 2 })[0]).toHaveTextContent('Analysis result')
    expect(css).toMatch(/@media \(min-width: 960px\)[^}]*\{[^}]*grid-template-columns/)
    expect(css).toMatch(/\.ask-chat, \.ask-result \{[^}]*position: sticky[^}]*max-block-size: calc\(100dvh[^}]*overflow-y: auto/)
    expect(css).not.toMatch(/\b(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/)
  })

  it('moves focus to the pane heading with the narrow toggle', async () => {
    await show()
    fireEvent.click(screen.getByRole('button', { name: 'Choose result elements' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Analysis result' })).toHaveFocus()
  })

  it('shows the result screen content expanded, without its toggle or Ask link', async () => {
    await show()
    const p = pane()
    expect(p.querySelector('.verdict .verdict-pill')).toHaveTextContent('Propaganda detected')
    expect(within(p).getByText('Doubt', { selector: '.tag' })).toBeInTheDocument()
    expect(within(p).getByText('People are destroying our future')).toBeInTheDocument()
    expect(within(p).getByText('future')).toBeInTheDocument()
    expect(within(p).getByRole('link', { name: /Explore/ })).toBeInTheDocument()
    expect(within(p).queryByRole('button', { name: /detailed analysis$/ })).toBeNull()
    expect(within(p).queryByRole('link', { name: /Ask VEIL/ })).toBeNull()
    // same components as /jobs/:id: these parts read the same (selection mode only adds toggles, passages and opens the risk lists)
    const parts = ['.verdict', '.results-excerpt', '.detailed-summary', '.metrics-bar', '.excerpt-box', '.wiki-lookup', '.term-context']
    const text = (sel: string) => { const c = (document.querySelector(sel) as Element).cloneNode(true) as Element; c.querySelectorAll('.focus-select').forEach((e) => e.remove()); return c.textContent }
    const shown = parts.map(text)
    cleanup()
    localStorage.setItem('veil.locale', 'en')
    render(<I18nProvider><ResultsView id="j1" /></I18nProvider>)
    fireEvent.click(await screen.findByRole('button', { name: /detailed analysis$/ }))
    expect(parts.map(text)).toEqual(shown)
  })

  it('gives every element kind a toggle button with aria-pressed, named after its label', async () => {
    await showNone()
    const all = toggles()
    expect(all).toHaveLength(15)
    expect(all.every((b) => b.tagName === 'BUTTON' && b.getAttribute('aria-pressed') === 'false')).toBe(true)
    const dim = translate('en', 'results.risk.dim.intensity')
    for (const l of ['Manipulation detected', 'Loaded language', 'Everyone knows', 'destroying', 'Doubt', 'Misleading headline', dim, 'People are destroying our future', 'future']) expect(toggle(l)).toBeInTheDocument()
    expect(toggle(translate('en', 'results.risk.driver.amplification'))).toBeInTheDocument() // driver, behind the (open) disclosure
    expect(toggle(translate('en', 'results.risk.caveat.bot_not_intent'))).toBeInTheDocument()
    const doubt = toggle('Doubt')
    doubt.focus()
    expect(doubt).toHaveFocus()
    expect(doubt.closest('[data-focus-selected]')).toBeNull()
    fireEvent.click(doubt) // Enter and Space activate a button through click
    expect(doubt).toHaveAttribute('aria-pressed', 'true')
    expect(doubt.closest('[data-focus-selected]')).not.toBeNull()
    expect(readFileSync('src/job/job.css', 'utf8')).toMatch(/button\.focus-select:focus-visible \{ outline: 2px solid var\(--blue\)/)
  })

  it('selects a technique, shows its chip, sends it as focus and removes it again', async () => {
    await showNone()
    fireEvent.click(toggle('Doubt'))
    expect(toggle('Doubt')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Remove Doubt' })).toBeInTheDocument()
    expect(screen.queryByText('Your question is about the whole analysis.')).toBeNull()
    await ask('q')
    await screen.findByText('An answer.')
    expect(chats()[0].body.focus).toEqual([{ kind: 'technique', ref: 'Doubt', label: 'Doubt' }])
    const bubble = document.querySelector('.bubble-user') as HTMLElement
    expect(within(bubble).getByText('About:')).toBeInTheDocument()
    expect(toggle('Doubt')).toHaveAttribute('aria-pressed', 'true') // kept after sending
    fireEvent.click(toggle('Doubt'))
    expect(toggle('Doubt')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('button', { name: /^Remove / })).toBeNull()
    await ask('again')
    await waitFor(() => expect(chats()).toHaveLength(2))
    expect(chats()[1].body).not.toHaveProperty('focus')
  })

  it('sends several elements in panel order, a passage by span and a driver by its raw index', async () => {
    jobBody = richJob({ risk: risk({ drivers: [null, 'x', { kind: 'amplification', text: 'raw driver' }] }) })
    await showNone()
    fireEvent.click(toggle(translate('en', 'results.risk.driver.amplification')))
    fireEvent.click(toggle('destroying'))
    fireEvent.click(toggle('Loaded language'))
    await ask('q')
    await screen.findByText('An answer.')
    expect(chats()[0].body.focus).toEqual([
      { kind: 'technique', ref: 'Loaded_Language', label: 'Loaded language' },
      { kind: 'passage', ref: '32:42:Loaded_Language', label: 'destroying' },
      { kind: 'risk_driver', ref: '2', label: translate('en', 'results.risk.driver.amplification') },
    ])
  })

  it('addresses Wikipedia claims and terms by their raw array index', async () => {
    jobBody = richJob({
      analyzers: [
        run('wikipedia', 'succeeded', { result: { claims: [null, { claim: 'second claim', wikis: [] }] } }),
        run('term_context', 'succeeded', { result: { terms: [{ term: '' }, { term: 'kept', in_post: 'p' }] } }),
      ],
    })
    await showNone()
    fireEvent.click(toggle('second claim'))
    fireEvent.click(toggle('kept'))
    await ask('q')
    await screen.findByText('An answer.')
    expect(chats()[0].body.focus).toEqual([
      { kind: 'wikipedia_claim', ref: '1', label: 'second claim' },
      { kind: 'term_context', ref: '1', label: 'kept' },
    ])
    expect(toggles().filter((b) => b.getAttribute('aria-label') === 'Ask about ')).toHaveLength(0) // the blank term has no toggle
  })

  it('gives repeated refs (equal kind and ref are one element) a toggle on the first occurrence only', async () => {
    const d = { name: 'Doubt', display: 'Doubt', explanation: 'x', spans: [{ technique: 'Doubt', text: 'knows', start: 9, end: 14 }] }
    jobBody = richJob({
      analyzers: [run('techniques', 'succeeded', { result: { detected: [d, d], span_status: 'ok' } })],
      risk: risk({ caveats: [{ id: 'bot_not_intent', text: 'a' }, { id: 'bot_not_intent', text: 'b' }] }),
    })
    await showNone()
    expect(screen.getAllByRole('button', { name: 'Ask about Doubt' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Ask about knows' })).toHaveLength(1)
    const caveat = `Ask about ${translate('en', 'results.risk.caveat.bot_not_intent')}`
    expect(screen.getAllByRole('button', { name: caveat })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: caveat }))
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
  })

  it('shows the same kinds with a localized name', async () => {
    await show('j1', 'de')
    expect(screen.getByRole('button', { name: `Zu ${translate('de', 'techniques.Doubt.name')} fragen` })).toBeInTheDocument()
  })

  it('allows at most 20 elements and says so politely', async () => {
    jobBody = terms(25)
    await showNone()
    for (let i = 0; i < 19; i++) fireEvent.click(toggle(`term ${i}`))
    expect(screen.queryByText('You can choose at most 20 elements.')).toBeNull()
    fireEvent.click(toggle('term 19'))
    expect(toggle('term 20')).toBeDisabled()
    expect(toggle('term 0')).toBeEnabled()
    expect(screen.getByText('You can choose at most 20 elements.')).toHaveAttribute('aria-live', 'polite')
    fireEvent.click(toggle('term 0'))
    expect(toggle('term 20')).toBeEnabled()
    fireEvent.click(toggle('term 20'))
    await ask('q')
    await screen.findByText('An answer.')
    expect(chats()[0].body.focus).toHaveLength(20)
  })

  it('clears the selection from the pane header and through chips', async () => {
    await showNone()
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull()
    fireEvent.click(toggle('Doubt'))
    fireEvent.click(toggle('Everyone knows'))
    fireEvent.click(screen.getByRole('button', { name: 'Remove Everyone knows' }))
    expect(toggle('Everyone knows')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(toggle('Everyone knows'))
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(toggles().filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull()
    await ask('q')
    await screen.findByText('An answer.')
    expect(chats()[0].body).not.toHaveProperty('focus')
  })

  it('keeps the original focus on Retry and leaves earlier bubbles alone', async () => {
    chat = () => err(503, 'chat_unavailable')
    await showNone()
    fireEvent.click(toggle('Doubt'))
    await ask('first')
    await screen.findByRole('alert')
    fireEvent.click(toggle('Doubt'))
    fireEvent.click(toggle('Everyone knows'))
    chat = () => reply('now it works')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await screen.findByText('now it works')
    expect(chats()[1].body.focus).toEqual([{ kind: 'technique', ref: 'Doubt', label: 'Doubt' }])
    expect(document.querySelectorAll('.bubble-user')[0]).not.toHaveTextContent('Everyone knows')
  })

  it.each([['queued'], ['running']])('shows a note and no toggles for a %s job and keeps the composer off', async (status) => {
    jobBody = richJob({ status, done: false })
    await show()
    expect(toggles()).toHaveLength(0)
    expect(within(pane()).getByText('Result elements can be chosen once the analysis has finished.')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('shows a note and no toggles for a completed job without elements', async () => {
    jobBody = job({ finalization: { status: 'failed', result: null } })
    await show()
    expect(toggles()).toHaveLength(0)
    expect(within(pane()).getByText('This analysis has no result elements to choose from.')).toBeInTheDocument()
  })

  it('disables the toggles while the composer is disabled after a 409', async () => {
    chat = () => err(409, 'job_not_completed', { status: 'failed' })
    await show()
    await ask('why?')
    await screen.findByText('This analysis did not finish, so there is nothing to ask about.')
    expect(toggle('Doubt')).toBeDisabled()
  })

  it('renders labels as literal text', async () => {
    const text = '<img src=x onerror=alert(1)>'
    jobBody = richJob({ input: { content: text }, analyzers: [run('techniques', 'succeeded', { result: { detected: [{ name: 'X', display: 'X', explanation: '', spans: [{ technique: 'X', text, start: 0, end: text.length }] }] } })] })
    await showNone()
    fireEvent.click(toggle(text))
    expect(screen.getByRole('button', { name: `Remove ${text}` }).previousElementSibling).toHaveAttribute('dir', 'auto')
    await ask('q')
    await screen.findByText('An answer.')
    expect(document.querySelector('.ask-split img, .ask-split b')).toBeNull()
    expect(chats()[0].body.focus).toEqual([{ kind: 'passage', ref: `0:${text.length}:X`, label: text }])
  })

  it('stores focus per turn in sessionStorage and restores it, but not the selection', async () => {
    await showNone()
    fireEvent.click(toggle('Doubt'))
    await ask('remember')
    await screen.findByText('An answer.')
    expect(JSON.parse(sessionStorage.getItem('veil.ask.j1') as string)[0]).toEqual({ role: 'user', content: 'remember', focus: [{ kind: 'technique', ref: 'Doubt', label: 'Doubt' }] })
    cleanup()
    await show()
    expect(document.querySelector('.bubble-focus')).toHaveTextContent('Doubt')
    expect(pressed()).toHaveLength(15) // back to the default, not the earlier selection
  })

  it('selects every element by default, shows the checked Select all in the pane header and sends all of them', async () => {
    await show()
    expect(pressed()).toHaveLength(15)
    expect(document.querySelectorAll('.focus-chips li')).toHaveLength(15)
    expect(selectAll()).toBeChecked()
    expect(selectAll().indeterminate).toBe(false)
    const head = document.querySelector('.ask-result-head') as HTMLElement
    expect([...head.children].map((c) => c.tagName).slice(0, 2)).toEqual(['H2', 'LABEL'])
    expect(head.children[1]).toContainElement(selectAll())
    expect(head.children[1]).toHaveTextContent('Select all')
    expect(css).toMatch(/\.focus-all \{[^}]*margin-inline-start: auto/)
    expect(css).toMatch(/\.focus-all input:focus-visible \{ outline: 2px solid var\(--blue\)/)
    await ask('q')
    await screen.findByText('An answer.')
    const focus = chats()[0].body.focus as { kind: string; ref: string }[]
    expect(focus).toHaveLength(15)
    expect(focus[0]).toEqual(expect.objectContaining({ kind: 'final_assessment', ref: 'final_assessment' }))
  })

  it('selects the first 20 by default with more elements and shows the limit note', async () => {
    jobBody = terms(25)
    await show()
    expect(pressed()).toHaveLength(20)
    expect(toggle('term 24')).toHaveAttribute('aria-pressed', 'false')
    expect(toggle('term 24')).toBeDisabled()
    expect(screen.getByText('You can choose at most 20 elements.')).toBeInTheDocument()
    expect(selectAll()).toBeChecked()
    fireEvent.click(selectAll())
    expect(pressed()).toHaveLength(0)
    fireEvent.click(selectAll())
    expect(pressed()).toHaveLength(20)
  })

  it('deselects everything from the checked state: no chips, whole-analysis hint, no focus', async () => {
    await show()
    fireEvent.click(selectAll())
    expect(selectAll()).not.toBeChecked()
    expect(selectAll().indeterminate).toBe(false)
    expect(document.querySelectorAll('.focus-chips li')).toHaveLength(0)
    expect(screen.getByText('Your question is about the whole analysis.')).toBeInTheDocument()
    await ask('q')
    await screen.findByText('An answer.')
    expect(chats()[0].body).not.toHaveProperty('focus')
  })

  it('selects all from a partial (indeterminate) and from an empty selection', async () => {
    await show()
    fireEvent.click(toggle('Doubt'))
    expect(pressed()).toHaveLength(14)
    expect(selectAll()).not.toBeChecked()
    expect(selectAll().indeterminate).toBe(true)
    fireEvent.click(selectAll())
    expect(pressed()).toHaveLength(15)
    expect(selectAll()).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(selectAll().indeterminate).toBe(false)
    fireEvent.click(selectAll())
    expect(pressed()).toHaveLength(15)
  })

  it('disables Select all after a 409 and leaves it out without elements or while the job runs', async () => {
    chat = () => err(409, 'job_not_completed', { status: 'failed' })
    await show()
    expect(selectAll()).toBeEnabled()
    await ask('why?')
    await screen.findByText('This analysis did not finish, so there is nothing to ask about.')
    expect(selectAll()).toBeDisabled()
    cleanup()
    jobBody = job({ finalization: { status: 'failed', result: null } })
    await show()
    expect(screen.queryByRole('checkbox')).toBeNull()
    cleanup()
    jobBody = richJob({ status: 'running', done: false })
    await show()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('applies the default once: when the job completes while open, and never again after the user changed it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    jobBody = richJob({ status: 'running', done: false })
    const view = <I18nProvider><AskView id="j1" /></I18nProvider>
    localStorage.setItem('veil.locale', 'en')
    const { rerender } = render(view)
    await screen.findByRole('textbox')
    expect(screen.queryByRole('checkbox')).toBeNull()
    jobBody = richJob()
    await act(async () => { vi.advanceTimersByTime(2_500) })
    expect(await screen.findByRole('checkbox', { name: 'Select all' })).toBeChecked()
    expect(document.querySelectorAll('.focus-chips li')).toHaveLength(15)
    fireEvent.click(selectAll())
    rerender(view)
    await act(async () => { vi.advanceTimersByTime(5_000) })
    expect(pressed()).toHaveLength(0)
    expect(selectAll()).not.toBeChecked()
  })

  it('labels Select all in Arabic', async () => {
    await show('j1', 'ar')
    expect(screen.getByRole('checkbox', { name: 'تحديد الكل' })).toBeChecked()
  })

  it('renders right-to-left with the chat first and no static Latin text but the brand', async () => {
    await show('j1', 'ar')
    expect(document.documentElement.dir).toBe('rtl')
    const split = document.querySelector('.ask-split') as HTMLElement
    expect(split.children[0]).toHaveClass('ask-chat')
    fireEvent.click(within(split.children[1] as HTMLElement).getAllByRole('button', { name: /^اسأل عن / })[0])
    const statics = [...split.querySelectorAll('.ask-result-head h2, .ask-result-head .chat-note, .focus-all, .focus-clear, .focus-toggle')].map((e) => e.textContent ?? '')
    statics.push((document.querySelector('.ask-result') as HTMLElement).getAttribute('aria-label') ?? '')
    expect(statics.join(' ').replace(/VEIL/g, '')).not.toMatch(/[A-Za-z]/)
    expect(statics.length).toBeGreaterThan(4)
  })
})
