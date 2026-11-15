import { readFileSync } from 'node:fs'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../i18n'
import { CATALOGS } from '../i18n/translate'
import ApiDocsView from './ApiDocsView'

const ORIGIN = 'https://example.test'
const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('location', { ...window.location, origin: ORIGIN })
})
afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  localStorage.clear()
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
})

const renderView = () => render(<I18nProvider><ApiDocsView /></I18nProvider>)
const blocks = () => [...document.querySelectorAll('pre')].map((p) => p.textContent ?? '')
const curls = () => blocks().filter((b) => b.startsWith('curl'))
const bodies = () => blocks().filter((b) => b.startsWith('{') && !b.includes('"id"')).map((b) => JSON.parse(b) as object)

describe('ApiDocsView', () => {
  it('makes no request and needs no login', () => {
    renderView()
    expect(screen.getByRole('heading', { level: 1, name: 'Public API' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('uses the page origin for the base URL and both curl commands', () => {
    renderView()
    const [base, ...rest] = blocks()
    expect(base).toBe(`${ORIGIN}/api/v1`)
    const [create, get] = curls()
    expect(create).toContain(`curl -s -X POST ${ORIGIN}/api/v1/public/analyses -H 'Content-Type: application/json' -d '`)
    expect(get).toBe(`curl -s ${ORIGIN}/api/v1/public/analyses/<id>`)
    expect(rest.filter((b) => b.includes('http')).every((b) => !b.includes('localhost'))).toBe(true)
  })

  it('shows the three request bodies as valid JSON with exactly the expected members', () => {
    renderView()
    expect(bodies().map((b) => Object.keys(b))).toEqual([['post'], ['comments'], ['post', 'comments']])
    const create = curls()[0]
    expect(JSON.parse(/-d '(.*)'$/.exec(create)![1])).toEqual(bodies()[2])
  })

  it('has no Authorization header in the curl commands and says no authentication is needed', () => {
    renderView()
    expect(curls()).toHaveLength(2)
    for (const c of curls()) expect(c).not.toContain('Authorization')
    expect(screen.getByText(/no API key, token, cookie or/)).toBeInTheDocument()
  })

  it('lists every PublicAnalysis member, the errors and the /jobs/<id> hint', () => {
    renderView()
    const rows = [...document.querySelectorAll('.api-table tbody th')].map((th) => th.textContent)
    for (const m of ['id', 'status', 'done', 'created_at', 'finished_at', 'coverage', 'input', 'finalization_status', 'result', 'techniques', 'bot_signal', 'evidence', 'error', 'share_url']) {
      expect(rows).toContain(m)
    }
    for (const c of ['rate_limited', 'payload_too_large', 'invalid_request', 'validation_failed', 'missing_content', 'scrape_unavailable', 'not_found']) {
      expect(rows).toContain(c)
    }
    expect(document.body.textContent).toContain('/jobs/<id>')
    const example = JSON.parse(blocks().find((b) => b.includes('"finalization_status"'))!)
    expect(Object.keys(example)).toEqual(expect.arrayContaining(['id', 'status', 'done', 'result', 'evidence', 'share_url']))
  })

  describe('copy buttons', () => {
    it('has one per code block and writes the exact text, then shows Copied', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
      renderView()
      const buttons = screen.getAllByRole('button', { name: /^Copy: / })
      expect(buttons).toHaveLength(blocks().length)
      expect(new Set(buttons.map((b) => b.getAttribute('aria-label'))).size).toBe(buttons.length) // each name tells the blocks apart
      await act(async () => fireEvent.click(buttons[3]))
      expect(writeText).toHaveBeenCalledWith(blocks()[3])
      expect(screen.getByRole('button', { name: /^Copied: / })).toBeInTheDocument()
    })

    it.each([
      ['unavailable', {}],
      ['rejecting', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } }],
    ])('fails silently when the clipboard is %s', async (_n, clip) => {
      vi.stubGlobal('navigator', { ...navigator, clipboard: undefined, ...clip })
      renderView()
      await act(async () => fireEvent.click(screen.getAllByRole('button', { name: /^Copy: / })[0]))
      expect(screen.queryByRole('button', { name: /^Copied: / })).toBeNull()
      expect(screen.getAllByRole('button', { name: /^Copy: / })).toHaveLength(blocks().length)
    })
  })

  describe('i18n', () => {
    const LOCALES = ['en', 'de', 'fr', 'ar', 'fi', 'ru'] as const
    it.each(LOCALES)('%s has shell.integrate_api and renders the page without missing keys', (lng) => {
      expect(CATALOGS[lng]['shell.integrate_api']).toBeTruthy()
      localStorage.setItem('veil.locale', lng)
      renderView()
      expect(document.body.textContent).not.toContain('…') // translate() answers "…" for a key no catalog has
      expect(document.querySelector('h1')?.textContent).toBe(CATALOGS[lng]['apiDocs.title'])
    })

    it('keeps the copy button on the code side: .api-code is direction: ltr', () => {
      expect(readFileSync('src/styles/api-docs.css', 'utf8')).toMatch(/\.api-code \{[^}]*direction: ltr/)
    })

    it('renders every code block dir=ltr in Arabic (RTL page)', () => {
      localStorage.setItem('veil.locale', 'ar')
      renderView()
      expect(document.documentElement).toHaveAttribute('dir', 'rtl')
      const pres = [...document.querySelectorAll('pre')]
      expect(pres.length).toBeGreaterThan(4)
      for (const pre of pres) expect(pre).toHaveAttribute('dir', 'ltr')
      for (const code of document.querySelectorAll('.api-docs code')) expect(code.closest('[dir="ltr"]')).not.toBeNull()
    })
  })
})

describe('Playground', () => {
  const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' }, ...init })
  const send = () => screen.getByRole('button', { name: /^(Send|Sending…)$/ })
  const pick = (name: string) => fireEvent.click(screen.getByRole('radio', { name }))
  const press = async () => {
    await act(async () => fireEvent.click(send()))
  }
  const okBody = { id: 'j_1', status: 'queued', done: false, error: null }

  it('renders directly before the curl section and makes no request on render or locale change', () => {
    renderView()
    const curl = screen.getByRole('heading', { level: 2, name: 'Try it with curl' }).closest('section')!
    const pg = curl.previousElementSibling!
    expect(within(pg as HTMLElement).getByRole('heading', { level: 2, name: 'Playground' })).toBeInTheDocument()
    expect(pg).toHaveClass('api-section')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the operations with method and full URL as ltr code, and the prefilled example', () => {
    renderView()
    expect(screen.getByText(`POST ${ORIGIN}/api/v1/public/analyses`)).toHaveAttribute('dir', 'ltr')
    const area = screen.getByLabelText('Request body (JSON)') as HTMLTextAreaElement
    expect(area).toHaveAttribute('dir', 'ltr')
    expect(area).toHaveAttribute('spellcheck', 'false')
    expect(JSON.parse(area.value)).toEqual(bodies()[2])
    expect(area.value).toBe(JSON.stringify(bodies()[2], null, 2))
    expect(screen.getByText(/starts a real analysis, and the public submit endpoint is rate limited/)).toBeInTheDocument()
    pick('Get an analysis')
    expect(screen.getByText(`GET ${ORIGIN}/api/v1/public/analyses/<id>`)).toHaveAttribute('dir', 'ltr')
  })

  it('resets the body to the example', () => {
    renderView()
    const area = screen.getByLabelText('Request body (JSON)') as HTMLTextAreaElement
    const example = area.value
    fireEvent.change(area, { target: { value: '{}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reset to example' }))
    expect(area.value).toBe(example)
  })

  it('creates: sends the body unchanged without credentials, shows 201, elapsed ms and highlighted JSON, and prefills the id', async () => {
    fetchMock.mockResolvedValue(json(okBody, { status: 201, statusText: 'Created' }))
    renderView()
    const area = screen.getByLabelText('Request body (JSON)') as HTMLTextAreaElement
    await press()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${ORIGIN}/api/v1/public/analyses`)
    expect(init).toMatchObject({ method: 'POST', credentials: 'omit', body: area.value, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })
    expect(Object.keys(init.headers)).not.toContain('Authorization')
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Status: 201 Created')
    expect(screen.getByText(/^\d+ ms$/)).toBeInTheDocument()
    const out = document.querySelector('.api-pg-response pre')!
    expect(out.textContent).toBe(JSON.stringify(okBody, null, 2))
    expect(out).toHaveAttribute('dir', 'ltr')
    expect(out.querySelector('.j-key')?.textContent).toBe('"id"')
    expect(out.querySelector('.j-str')?.textContent).toBe('"j_1"')
    expect(out.querySelector('.j-lit')?.textContent).toBe('false')
    expect(screen.getByRole('radio', { name: 'Create an analysis' })).toBeChecked()
    pick('Get an analysis')
    expect(screen.getByLabelText('Analysis id')).toHaveValue('j_1')
  })

  it('copies the pretty-printed response', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    fetchMock.mockResolvedValue(json(okBody, { status: 201 }))
    renderView()
    await press()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy: Response' })))
    expect(writeText).toHaveBeenCalledWith(JSON.stringify(okBody, null, 2))
    expect(screen.getByRole('button', { name: 'Copied: Response' })).toBeInTheDocument()
  })

  it('gets: escapes the id, sends GET without credentials and shows done', async () => {
    fetchMock.mockResolvedValue(json({ id: 'a/b', status: 'completed', done: true }, { status: 200, statusText: 'OK' }))
    renderView()
    pick('Get an analysis')
    expect(send()).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Analysis id'), { target: { value: '  ' } })
    expect(send()).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Analysis id'), { target: { value: 'a/b' } })
    await press()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${ORIGIN}/api/v1/public/analyses/a%2Fb`)
    expect(init).toMatchObject({ method: 'GET', credentials: 'omit', headers: { Accept: 'application/json' } })
    expect(init.body).toBeUndefined()
    expect(Object.keys(init.headers)).toEqual(['Accept'])
    expect(screen.getByRole('status')).toHaveTextContent('200 OK')
    expect(document.querySelector('.api-pg-response pre')!.textContent).toContain('"done": true')
  })

  it.each([
    [400, 'Bad Request', { error: { code: 'missing_content', message: 'content is required' } }],
    [422, 'Unprocessable Entity', { error: { code: 'validation_failed', message: 'bad', details: { fields: { comments: 'max 100' } } } }],
    [404, 'Not Found', { error: { code: 'not_found', message: 'no such analysis' } }],
  ])('shows the %i error envelope as returned', async (status, statusText, envelope) => {
    fetchMock.mockResolvedValue(json(envelope, { status, statusText }))
    renderView()
    await press()
    expect(screen.getByRole('status')).toHaveTextContent(`${status} ${statusText}`)
    expect(document.querySelector('.api-pg-response pre')!.textContent).toBe(JSON.stringify(envelope, null, 2))
  })

  it('does not prefill the id from an error response', async () => {
    fetchMock.mockResolvedValue(json({ id: 'x' }, { status: 400 }))
    renderView()
    await press()
    pick('Get an analysis')
    expect(screen.getByLabelText('Analysis id')).toHaveValue('')
  })

  it('429: shows the retry delay from Retry-After, else from details, else omits it', async () => {
    const env = (details?: object) => ({ error: { code: 'rate_limited', message: 'slow down', ...(details ? { details } : {}) } })
    fetchMock.mockResolvedValueOnce(json(env(), { status: 429, headers: { 'Retry-After': '7' } }))
    renderView()
    await press()
    expect(screen.getByText('Rate limited, retry after 7 s')).toBeInTheDocument()
    fetchMock.mockResolvedValueOnce(json(env({ retry_after_s: 12 }), { status: 429 }))
    await press()
    expect(screen.getByText('Rate limited, retry after 12 s')).toBeInTheDocument()
    fetchMock.mockResolvedValueOnce(json(env({ retry_after_s: 0 }), { status: 429, headers: { 'Retry-After': 'soon' } }))
    await press()
    expect(screen.queryByText(/Rate limited, retry after/)).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('429')
  })

  it('shows a translated message and no status on a network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    renderView()
    await press()
    expect(screen.getByRole('status')).toHaveTextContent(/network error/)
    expect(screen.queryByText(/^Status:/)).toBeNull()
    expect(send()).toBeEnabled()
  })

  it('shows a non-JSON body as plain text with a note, and an empty body with a note', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' }))
    renderView()
    await press()
    expect(screen.getByText('Response is not JSON')).toBeInTheDocument()
    const pre = document.querySelector('.api-pg-response pre')!
    expect(pre.textContent).toBe('<html>Bad Gateway</html>')
    expect(pre.querySelector('span')).toBeNull()
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await press()
    expect(screen.getByText('Empty response')).toBeInTheDocument()
    expect(document.querySelector('.api-pg-response pre')).toBeNull()
  })

  it('warns about invalid JSON but keeps Send enabled and sends the text unchanged', async () => {
    fetchMock.mockResolvedValue(json({ error: { code: 'invalid_request', message: 'bad json' } }, { status: 400 }))
    renderView()
    const area = screen.getByLabelText('Request body (JSON)')
    expect(area).toHaveAttribute('aria-invalid', 'false')
    fireEvent.change(area, { target: { value: '{ nope' } })
    expect(area).toHaveAttribute('aria-invalid', 'true')
    const warn = screen.getByText(/This text is not valid JSON/)
    expect(area.getAttribute('aria-describedby')).toBe(warn.id)
    expect(send()).toBeEnabled()
    await press()
    expect(fetchMock.mock.calls[0][1].body).toBe('{ nope')
    expect(screen.getByRole('status')).toHaveTextContent('400')
  })

  it('disables Send and shows Sending… while a request is in flight, one at a time', async () => {
    let resolve!: (r: Response) => void
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)))
    renderView()
    await press()
    expect(send()).toBeDisabled()
    expect(send()).toHaveTextContent('Sending…')
    fireEvent.click(send())
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(async () => resolve(json(okBody, { status: 201 })))
    await waitFor(() => expect(send()).toBeEnabled())
    expect(send()).toHaveTextContent('Send')
  })

  it('aborts a pending request on unmount without touching state', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    let signal!: AbortSignal
    fetchMock.mockImplementation((_u: string, init: RequestInit) => {
      signal = init.signal!
      return new Promise((_r, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))
    })
    const { unmount } = renderView()
    await press()
    unmount()
    await act(async () => {})
    expect(signal.aborted).toBe(true)
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('renders translated, ltr code in Arabic', async () => {
    localStorage.setItem('veil.locale', 'ar')
    fetchMock.mockResolvedValue(json(okBody, { status: 201 }))
    renderView()
    expect(screen.getByRole('heading', { level: 2, name: CATALOGS.ar['apiDocs.playground.title'] })).toBeInTheDocument()
    const area = screen.getByLabelText(CATALOGS.ar['apiDocs.playground.body'])
    expect(area).toHaveAttribute('dir', 'ltr')
    expect(screen.getByText(`POST ${ORIGIN}/api/v1/public/analyses`)).toHaveAttribute('dir', 'ltr')
    await act(async () => fireEvent.click(screen.getByRole('button', { name: CATALOGS.ar['apiDocs.playground.send'] })))
    expect(document.querySelector('.api-pg-response pre')).toHaveAttribute('dir', 'ltr')
    expect(screen.getByRole('status')).toHaveTextContent('201')
  })
})
