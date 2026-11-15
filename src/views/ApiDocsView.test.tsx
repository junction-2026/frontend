import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
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
      const buttons = screen.getAllByRole('button', { name: 'Copy' })
      expect(buttons).toHaveLength(blocks().length)
      await act(async () => fireEvent.click(buttons[3]))
      expect(writeText).toHaveBeenCalledWith(blocks()[3])
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
    })

    it.each([
      ['unavailable', {}],
      ['rejecting', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } }],
    ])('fails silently when the clipboard is %s', async (_n, clip) => {
      vi.stubGlobal('navigator', { ...navigator, clipboard: undefined, ...clip })
      renderView()
      await act(async () => fireEvent.click(screen.getAllByRole('button', { name: 'Copy' })[0]))
      expect(screen.queryByRole('button', { name: 'Copied' })).toBeNull()
      expect(screen.getAllByRole('button', { name: 'Copy' })).toHaveLength(blocks().length)
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
