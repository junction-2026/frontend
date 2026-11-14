import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelJob, createJob, getJob, listAnalyzers, listJobs } from './client'
import { errorMessage } from './errors'
import { isDone, verdictOf } from './types'

const fetchMock = vi.fn()
beforeEach(() => vi.stubGlobal('fetch', fetchMock))
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const calls = () => fetchMock.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET'])

// Each endpoint function, how it is called, and the request it must send.
const endpoints: [string, () => ReturnType<typeof getJob>, [string, string]][] = [
  ['createJob', () => createJob({ input: { content: 'hi' } }), ['/api/v1/jobs', 'POST']],
  ['listJobs', () => listJobs({ limit: 5, cursor: 'c 1', status: 'running' }) as never, ['/api/v1/jobs?limit=5&cursor=c+1&status=running', 'GET']],
  ['getJob', () => getJob('a/b c'), ['/api/v1/jobs/a%2Fb%20c', 'GET']],
  ['cancelJob', () => cancelJob('a/b c'), ['/api/v1/jobs/a%2Fb%20c/cancel', 'POST']],
  ['listAnalyzers', () => listAnalyzers() as never, ['/api/v1/analyzers', 'GET']],
]

describe.each(endpoints)('%s', (_name, call, request) => {
  it('sends the request and returns the parsed body', async () => {
    fetchMock.mockResolvedValue(json({ id: 'j', extra: 1 }))
    expect(await call()).toEqual({ ok: true, data: { id: 'j', extra: 1 } })
    expect(calls()).toEqual([request])
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Accept: 'application/json' })
  })

  it('maps an error envelope', async () => {
    fetchMock.mockResolvedValue(json({ error: { code: 'validation_failed', message: 'bad', details: { fields: { 'input.content': 'blank' } } } }, 422))
    expect(await call()).toEqual({
      ok: false,
      error: { status: 422, code: 'validation_failed', message: 'bad', details: { fields: { 'input.content': 'blank' } } },
    })
  })

  it('maps a non-JSON error body to http_<status>', async () => {
    fetchMock.mockResolvedValue(new Response('<html>bad gateway</html>', { status: 502, statusText: 'Bad Gateway' }))
    expect(await call()).toEqual({ ok: false, error: { status: 502, code: 'http_502', message: 'HTTP 502 Bad Gateway' } })
  })

  it('maps JSON without an envelope to http_<status>', async () => {
    fetchMock.mockResolvedValue(json({ detail: 'x' }, 500))
    expect(await call()).toMatchObject({ ok: false, error: { status: 500, code: 'http_500' } })
  })

  it('maps a network error to network_error without throwing', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    expect(await call()).toEqual({ ok: false, error: { status: 0, code: 'network_error', message: 'Failed to fetch' } })
  })

  it('reports a 2xx non-JSON body as invalid_response', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 200 }))
    expect(await call()).toMatchObject({ ok: false, error: { code: 'invalid_response' } })
  })
})

describe('createJob', () => {
  it('posts the JSON body', async () => {
    fetchMock.mockResolvedValue(json({ id: 'j' }, 201))
    await createJob({ input: { content: 'x' }, analyzers: ['a'], options: { finalize: false } })
    const init = fetchMock.mock.calls[0][1]
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body)).toEqual({ input: { content: 'x' }, analyzers: ['a'], options: { finalize: false } })
  })
})

describe('listJobs', () => {
  it('omits the query string without options', async () => {
    fetchMock.mockResolvedValue(json({ items: [], next_cursor: null }))
    await listJobs()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/jobs')
  })
})

describe('type helpers', () => {
  it('verdictOf treats unknown verdicts as uncertain', () => {
    expect(verdictOf('detected')).toBe('detected')
    expect(verdictOf('not_detected')).toBe('not_detected')
    expect(verdictOf('maybe')).toBe('uncertain')
    expect(verdictOf(undefined)).toBe('uncertain')
  })

  it('isDone follows done for an unknown status', () => {
    expect(isDone({ done: true })).toBe(true)
    expect(isDone({ done: false })).toBe(false)
  })
})

describe('errorMessage', () => {
  const e = (code: string, details?: Record<string, unknown>) => ({ status: 400, code, message: `server ${code}`, details })

  it('has copy for every known code', () => {
    for (const code of ['invalid_request', 'not_found', 'method_not_allowed', 'internal_error', 'analyzer_not_selectable', 'job_finished', 'network_error'])
      expect(errorMessage(e(code))).not.toContain(`server ${code}`)
    expect(errorMessage(e('payload_too_large'))).toBe('Content is larger than 1 MiB')
  })

  it('lists validation fields per path', () => {
    expect(errorMessage(e('validation_failed', { fields: { 'input.content': 'must not be blank', 'scrape.url': 'invalid' } }))).toBe(
      'Some fields are not valid: input.content: must not be blank; scrape.url: invalid',
    )
  })

  it('lists unknown analyzers', () => {
    expect(errorMessage(e('unknown_analyzer', { analyzer_ids: ['a', 'b'] }))).toContain('a, b')
  })

  it('falls back to the server message for other codes', () => {
    expect(errorMessage(e('scrape_unavailable'))).toBe('server scrape_unavailable')
  })
})
