import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { I18nProvider } from '../i18n'
import { assessment, finalization, job, json } from '../job/fixtures'
import DetailView from './DetailView'

const fetchMock = vi.fn()
beforeEach(() => vi.stubGlobal('fetch', fetchMock))
afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  localStorage.clear()
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
})

// Renders under the real provider in a given locale (the choice is read from storage like on a reload).
const inLocale = (lng: string, ui: ReactElement) => {
  localStorage.setItem('stiriri.locale', lng)
  return render(<I18nProvider>{ui}</I18nProvider>)
}

const show = async (j: unknown) => {
  fetchMock.mockResolvedValue(json(j))
  render(<DetailView id="j1" />)
  await screen.findByText('Patterns')
}
const withResult = (extra: Record<string, unknown>) => job({ finalization: finalization('completed', { result: assessment(extra) }) })
const section = () => screen.getByRole('heading', { name: 'Final assessment' }).closest('section') as HTMLElement

describe('Detail: final assessment', () => {
  it('shows the verdict label and user_text literally, without a confidence number', async () => {
    const text = '<b>fake</b> [click](https://example.com)'
    await show(withResult({ verdict: 'detected', user_text: text, confidence: 0.86 }))
    expect(section()).toHaveTextContent('Manipulation detected')
    expect(screen.getByText(text)).toBeInTheDocument()
    expect(section().querySelector('b, a')).toBeNull()
    expect(screen.queryByText(/0\.86|86 ?%/)).toBeNull()
    expect(screen.queryByText('Insufficient evidence')).toBeNull()
  })

  it('reads an unknown verdict as Uncertain and tags an orchestrator result', async () => {
    await show(withResult({ verdict: 'suspicious', produced_by: 'orchestrator' }))
    expect(section()).toHaveTextContent('Uncertain')
    expect(screen.getByText('Insufficient evidence')).toBeInTheDocument()
  })

  it.each([
    ['skipped', finalization('skipped', { reason: 'not_configured' })],
    ['pending', finalization('pending')],
    ['failed', finalization('failed', { error: { code: 'timeout', message: 'x' } })],
  ])('omits the section when finalization is %s', async (_n, f) => {
    await show(job({ finalization: f }))
    expect(screen.queryByRole('heading', { name: 'Final assessment' })).toBeNull()
  })
})

describe('Detail in another locale', () => {
  it('renders German chrome with the translated verdict label, and the API text unchanged', async () => {
    fetchMock.mockResolvedValue(json(withResult({ verdict: 'detected', user_text: '<b>fake</b> {count}' })))
    inLocale('de', <DetailView id="j1" />)
    expect(await screen.findByText('Muster')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Detaillierte Analyse' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Zurück zur Zusammenfassung/ })).toHaveAttribute('href', '/jobs/j1')
    expect(screen.getByRole('heading', { name: 'Abschließende Bewertung' }).closest('section')).toHaveTextContent('Manipulation erkannt')
    expect(screen.getByText('<b>fake</b> {count}')).toBeInTheDocument()
    expect(screen.getByText(/keine Technikanalyse|Keine Technikanalyse/i)).toBeInTheDocument()
  })

  it('shows the not-found alert in the active locale', async () => {
    fetchMock.mockResolvedValue(json({ error: { code: 'not_found', message: 'nope' } }, 404))
    inLocale('de', <DetailView id="j1" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Auftrag nicht gefunden')
  })
})
