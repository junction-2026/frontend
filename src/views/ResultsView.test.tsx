import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { I18nProvider, useLocale, type Locale } from '../i18n'
import { assessment, coverage, finalization, job, json, risk, run } from '../job/fixtures'
import ResultsView from './ResultsView'

const fetchMock = vi.fn()
beforeEach(() => vi.stubGlobal('fetch', fetchMock))
afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  localStorage.clear()
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
})

// Renders under the real provider in a given locale (the choice is read from storage like on a reload).
const inLocale = (lng: string, ui: ReactElement) => {
  localStorage.setItem('veil.locale', lng)
  return render(<I18nProvider>{ui}</I18nProvider>)
}
const Switch = ({ to }: { to: Locale }) => {
  const { setLocale } = useLocale()
  return <button onClick={() => setLocale(to)}>switch</button>
}

const show = async (j: unknown) => {
  fetchMock.mockResolvedValue(json(j))
  render(<ResultsView id="j1" />)
  return screen.findByRole('heading', { level: 2 })
}
const withResult = (extra: Record<string, unknown>) => job({ finalization: finalization('completed', { result: assessment(extra) }) })
const techniques = (detected: unknown[], status = 'succeeded') => run('techniques', status, { result: { detected } })
const inMock = (el: HTMLElement) => el.closest('[data-mock]')
const toggle = () => fireEvent.click(screen.getByRole('button', { name: /detailed analysis$/ }))
const verdictEl = () => document.querySelector('[data-verdict]') as HTMLElement
const long = (n: number) => 'x'.repeat(n)

describe('Results: verdict component', () => {
  it.each([
    ['detected', 'Yes, propaganda detected.', 'Propaganda detected'],
    ['not_detected', 'No clear signs of propaganda.', 'No clear signs'],
    ['uncertain', 'The result is inconclusive.', 'Inconclusive'],
    ['suspicious', 'The result is inconclusive.', 'Inconclusive'], // unknown reads as uncertain
  ])('shows verdict %s', async (verdict, heading, pill) => {
    const h = await show(withResult({ verdict, confidence: 0.95 }))
    const el = verdictEl()
    expect(document.querySelectorAll('[data-verdict]')).toHaveLength(1)
    expect(el.tagName).toBe('SECTION')
    expect(el.dataset.verdict).toBe(verdict === 'suspicious' ? 'uncertain' : verdict)
    expect(el).toContainElement(h)
    expect(h).toHaveTextContent(heading)
    expect(el.querySelector('.verdict-pill')).toHaveTextContent(pill)
    expect(el.querySelector('.verdict-summary')).toHaveTextContent('This text pressures the reader.')
    expect(el).toHaveTextContent('95% confidence')
    expect(inMock(h)).toBeNull()
    // header row first (pill, then confidence), then headline and summary
    expect([...el.children].slice(0, 3).map((c) => c.className || c.tagName)).toEqual(['verdict-head', 'H2', 'verdict-summary'])
    expect([...(el.firstElementChild as HTMLElement).children].map((c) => c.className)).toEqual(['verdict-pill', 'verdict-confidence'])
  })

  it('falls back to the fixed verdict sentence when the user text gives no usable sentence', async () => {
    await show(withResult({ verdict: 'uncertain', user_text: 'Too short.' }))
    expect(verdictEl().querySelector('.verdict-summary')).toHaveTextContent('The available evidence is insufficient or conflicting.')
    cleanup()
    await show(withResult({ verdict: 'not_detected', user_text: '' }))
    expect(verdictEl().querySelector('.verdict-summary')).toHaveTextContent('VEIL did not identify strong indicators of propaganda in this content.')
    expect(screen.queryByRole('button', { name: 'Read full explanation' })).toBeNull()
  })

  it.each([['detected'], ['not_detected'], ['uncertain']])('chooses the %s state only from the verdict, never from confidence', async (verdict) => {
    const seen: string[][] = []
    for (const confidence of [0.05, 0.95]) {
      const h = await show(withResult({ verdict, confidence }))
      const el = verdictEl()
      expect(el.dataset.verdict).toBe(verdict)
      seen.push([el.className, h.textContent ?? '', el.querySelector('.verdict-pill')?.textContent ?? '', el.querySelector('.verdict-summary')?.textContent ?? ''])
      expect(el.querySelectorAll('.info-card')).toHaveLength(0) // fixture has no card data: none appear or vanish with confidence
      cleanup()
    }
    expect(seen[0]).toEqual(seen[1])
  })

  it('shows the confidence as a rounded percentage', async () => {
    await show(withResult({ confidence: 0.94 }))
    expect(verdictEl()).toHaveTextContent('94% confidence')
  })

  it.each([[null], [undefined], ['0.9'], [Number.NaN], [1.2], [-0.1]])('shows "Confidence unavailable" for %s', async (confidence) => {
    await show(withResult({ confidence }))
    expect(verdictEl()).toHaveTextContent('Confidence unavailable')
    expect(verdictEl().textContent).not.toMatch(/%/)
  })

  it('explains confidence in a tooltip on focus and hover, and hides it on blur and Escape', async () => {
    await show(withResult({}))
    const btn = screen.getByRole('button', { name: 'What does confidence mean?' })
    expect(screen.queryByRole('tooltip')).toBeNull()
    act(() => btn.focus())
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent("How confident VEIL's final assessment is that this verdict is supported by the available evidence. It is not the probability that the content is propaganda.")
    expect(btn).toHaveAttribute('aria-describedby', tip.id)
    fireEvent.keyDown(btn, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).toBeNull()
    fireEvent.mouseEnter(btn)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.mouseLeave(btn)
    expect(screen.queryByRole('tooltip')).toBeNull()
    act(() => btn.focus())
    act(() => btn.blur())
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(document.body.textContent).not.toMatch(/calibrated|model consensus|probability of propaganda/i)
  })

  it('never shows the word consensus or a percentage other than the confidence', async () => {
    await show(withResult({ confidence: 0.94, user_text: 'This text pressures the reader. It repeats 50% of its claims.' }))
    expect(verdictEl().textContent).not.toMatch(/consensus/i)
    expect(verdictEl().textContent?.match(/\d+\s?%/g)).toEqual(['94%'])
  })

  it('shows user_text literally as a text node', async () => {
    const text = '<b>fake</b> [click](https://example.com) http://example.com'
    await show(withResult({ user_text: text }))
    expect(screen.getByText(text)).toBeInTheDocument()
    expect(verdictEl().querySelector('b, a')).toBeNull()
    expect(screen.getByText(text)).toHaveClass('verdict-summary')
    expect(screen.queryByRole('button', { name: 'Read full explanation' })).toBeNull() // the whole text is the summary
  })

  it('shows one sentence and reveals the full plain text behind "Read full explanation"', async () => {
    const full = 'This text pressures the reader. Read <b>fake</b> [click](https://example.com)\nSecond line.'
    await show(withResult({ user_text: full }))
    const btn = screen.getByRole('button', { name: 'Read full explanation' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('This text pressures the reader.')).toHaveAttribute('dir', 'auto')
    expect(document.querySelector('.verdict-user-text')).toBeNull() // collapsed content is not rendered
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(btn).toHaveAccessibleName('Hide full explanation')
    const block = document.getElementById(btn.getAttribute('aria-controls') as string) as HTMLElement
    expect(block).toHaveClass('verdict-user-text')
    expect(block).toHaveAttribute('dir', 'auto')
    expect(block.textContent).toBe(full)
    expect(verdictEl().querySelector('b, a')).toBeNull()
    fireEvent.click(btn)
    expect(document.querySelector('.verdict-user-text')).toBeNull()
  })

  it('never cuts a long text: a too long first sentence gives the fixed sentence and the full text stays reachable', async () => {
    const text = `${'word '.repeat(60)}end. Next one.`
    await show(withResult({ verdict: 'detected', user_text: text }))
    expect(verdictEl().querySelector('.verdict-summary')).toHaveTextContent('VEIL identified signs of manipulative messaging in this content.')
    fireEvent.click(screen.getByRole('button', { name: 'Read full explanation' }))
    expect(document.querySelector('.verdict-user-text')?.textContent).toBe(text.trim())
    expect(screen.queryByText(/…/)).toBeNull()
  })

  it('labels an orchestrator uncertain result as insufficient evidence', async () => {
    await show(withResult({ verdict: 'uncertain', confidence: null, produced_by: 'orchestrator' }))
    expect(within(verdictEl()).getByText('Insufficient evidence')).toHaveClass('verdict-pill')
    expect(verdictEl().querySelector('h2')).toHaveTextContent('The result is inconclusive.')
    cleanup()
    await show(withResult({ verdict: 'uncertain' }))
    expect(screen.queryByText('Insufficient evidence')).toBeNull()
  })

  it('warns inside the verdict when an analyzer failed or timed out, not otherwise', async () => {
    await show(job({ coverage: coverage({ failed: 0 }), analyzers: [run('claims', 'succeeded')] }))
    expect(screen.queryByRole('note')).toBeNull()
    cleanup()
    await show(job({ coverage: coverage({ failed: 0 }), analyzers: [run('claims', 'failed', { error: { code: 'timeout', message: 'x' } })] }))
    expect(within(verdictEl()).getByRole('note')).toHaveTextContent('Some analyzers did not finish, so this result is based on partial evidence.')
    cleanup()
    await show(job({ coverage: coverage({ failed: 2 }) }))
    expect(within(verdictEl()).getByRole('note')).toBeInTheDocument()
    cleanup()
    await show(job({ coverage: coverage({ failed: 0 }) }))
    expect(screen.queryByRole('note')).toBeNull()
  })
})

describe('Results: progressive disclosure', () => {
  const rich = () =>
    job({
      analyzers: [
        techniques([{ name: 'Loaded_Language', display: 'Loaded Language', score: 0.91 }, { name: 'Doubt', display: 'Doubt', plain_language: { name: 'Zweifel' } }]),
        run('topic_extraction', 'succeeded', { result: { claims: [{}, {}, {}] } }),
      ],
    })

  it('shows only the verdict and the two actions at first', async () => {
    await show(rich())
    const btn = screen.getByRole('button', { name: 'View detailed analysis' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(btn).toHaveClass('btn-primary')
    expect(screen.getByRole('link', { name: 'Ask VEIL' })).toHaveAttribute('href', '/jobs/j1/ask')
    expect(screen.getByRole('link', { name: 'Ask VEIL' })).toHaveClass('btn-secondary')
    expect(screen.queryByRole('region', { name: 'Detailed analysis' })).toBeNull()
    for (const t of [/Zweifel/, /Loaded Language/, /Analyzer coverage/, /Patterns/, /Polarity/, /bias factor/, /Everyone knows/, /Propaganda Techniques Detected/])
      expect(screen.queryByText(t)).toBeNull()
    expect(screen.queryByText(/Have questions about this verdict/)).toBeNull()
    expect(inMock(screen.getByRole('link', { name: 'Ask VEIL' }))).toBeNull()
  })

  it('expands to the full detailed analysis and collapses again, keeping focus on the button', async () => {
    await show(rich())
    const btn = screen.getByRole('button', { name: 'View detailed analysis' })
    btn.focus()
    fireEvent.click(btn)
    expect(btn).toHaveAccessibleName('Hide detailed analysis')
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    const region = screen.getByRole('region', { name: 'Detailed analysis' })
    expect(btn).toHaveAttribute('aria-controls', region.id)
    expect(document.activeElement).toBe(btn)
    const tags = region.querySelector('.tags') as HTMLElement
    expect([...tags.children].map((t) => t.textContent)).toEqual(['Loaded Language', 'Zweifel'])
    expect(within(region).queryByText(/0\.91|91 ?%/)).toBeNull()
    expect(within(region).getByText('2 detected')).toBeInTheDocument()
    expect(within(region).getByText('3 extracted')).toBeInTheDocument()
    expect(within(region).getByRole('heading', { name: 'Propaganda Techniques Detected' })).toBeInTheDocument()
    expect(within(region).getByRole('heading', { name: 'Analyzer coverage' })).toBeInTheDocument()
    expect(region.querySelector('.quote-text')).toHaveTextContent('Everyone knows')
    expect(region.querySelector('.job-text')).toHaveTextContent('Everyone knows')
    expect(within(region).getByRole('link', { name: 'Open detailed analysis page' })).toHaveAttribute('href', '/jobs/j1/detail')
    fireEvent.click(btn)
    expect(btn).toHaveAccessibleName('View detailed analysis')
    expect(screen.queryByRole('region', { name: 'Detailed analysis' })).toBeNull()
    expect(screen.queryByText('Analyzer coverage')).toBeNull()
  })

  it('cuts the analyzed excerpt at 400 characters', async () => {
    await show(job({ input: { content: long(500) } }))
    toggle()
    expect(screen.getByText(`${long(400)}…`, { selector: 'bdi' })).toBeInTheDocument()
  })

  it('shows no technique tags for a failed techniques run', async () => {
    await show(job({ analyzers: [techniques([{ name: 'Doubt', display: 'Doubt' }], 'failed')] }))
    toggle()
    expect(document.querySelector('.tags')).toBeNull()
  })
})

describe('Results: finalization and job states', () => {
  const analyzers = [run('techniques', 'succeeded', { result: { detected: [] } })]

  it.each([['pending'], ['running']])('shows progress while finalization is %s, with analyzers visible', async (status) => {
    await show(job({ status: 'finalizing', done: false, finalization: finalization(status), analyzers }))
    expect(screen.getByText('Final assessment in progress')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Watch live progress' })).toBeInTheDocument()
    toggle()
    expect(screen.getByText('Technique detection')).toBeInTheDocument()
    expect(verdictEl()).toBeNull()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('The analyzers are still working.')
  })

  it.each([
    ['not_configured', 'No final assessment configured'],
    ['disabled_by_request', 'Final assessment turned off for this job'],
    ['cancelled', 'Final assessment cancelled'],
  ])('shows the reason of a skipped finalization (%s)', async (reason, text) => {
    await show(job({ finalization: finalization('skipped', { reason }), analyzers }))
    expect(screen.getByText(text)).toBeInTheDocument()
    toggle()
    expect(screen.getByText('Technique detection')).toBeInTheDocument()
    expect(screen.queryByText('Analysis failed')).toBeNull()
    expect(verdictEl()).toBeNull()
    expect(screen.queryByText(/confidence/i)).toBeNull()
    expect(screen.getByText('Final assessment skipped')).toHaveClass('status-pill', 'gray')
  })

  it('shows "No final assessment" for a done job without a finalization result', async () => {
    await show(job({ finalization: finalization('pending') }))
    expect(screen.getByText('No final assessment')).toHaveClass('status-pill', 'gray')
    expect(screen.getByText('No final assessment is available for this job.')).toBeInTheDocument()
    expect(verdictEl()).toBeNull()
  })

  it('shows a failed finalization with its code, and Timed out for timeout', async () => {
    await show(job({ finalization: finalization('failed', { error: { code: 'adapter_error', message: 'x' } }), analyzers }))
    expect(screen.getByText('Final assessment failed')).toBeInTheDocument()
    expect(screen.getByText('adapter_error')).toBeInTheDocument()
    expect(verdictEl()).toBeNull()
    cleanup()
    await show(job({ finalization: finalization('failed', { error: { code: 'timeout', message: 'x' } }), analyzers }))
    expect(screen.getByText('Timed out')).toBeInTheDocument()
    expect(screen.queryByText('Analysis failed')).toBeNull()
  })

  it('shows the scrape error card for a failed scrape, as plain text', async () => {
    await show(
      job({
        status: 'failed', input: null,
        scrape: { status: 'failed', url: 'https://x.com/a', error: { code: 'account_private', message: '<i>Account</i> is private' } },
        finalization: finalization('skipped', { reason: 'cancelled' }),
      }),
    )
    expect(screen.getByText('Scrape failed')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('<i>Account</i> is private')
    expect(verdictEl()).toBeNull()
    expect(screen.getByText('Error code: account_private')).toBeInTheDocument()
    expect(document.querySelector('h2 i')).toBeNull()
  })

  it('shows "Analysis failed" for any other failed job', async () => {
    await show(job({ status: 'failed', finalization: finalization('skipped') }))
    expect(screen.getByText('Analysis failed')).toBeInTheDocument()
    expect(verdictEl()).toBeNull()
    expect(screen.queryByText(/confidence/i)).toBeNull()
  })

  it('shows Cancelled and keeps the settled runs', async () => {
    await show(job({ status: 'cancelled', finalization: finalization('skipped', { reason: 'cancelled' }), analyzers: [run('techniques', 'succeeded', { result: { detected: [] } }), run('claims', 'failed', { error: { code: 'cancelled', message: 'x' } })] }))
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(verdictEl()).toBeNull()
    toggle()
    expect(screen.getByText('Technique detection')).toBeInTheDocument()
    expect(screen.getByText('claims analyzer')).toBeInTheDocument()
  })

  it('judges an unknown status by done', async () => {
    await show(job({ status: 'archived', done: true, finalization: finalization('completed', { result: assessment() }) }))
    expect(screen.getByText('Yes, propaganda detected.')).toBeInTheDocument()
    cleanup()
    vi.useFakeTimers()
    fetchMock.mockResolvedValue(json(job({ status: 'archived', done: false, finalization: finalization('pending') })))
    render(<ResultsView id="j1" />)
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(screen.getByRole('link', { name: 'Watch live progress' })).toBeInTheDocument()
  })
})

describe('Results: coverage and analyzer outcomes', () => {
  it('shows coverage counts, a bar sized by settled/total and one row per run', async () => {
    await show(
      job({
        coverage: coverage({ total: 4, applicable: 3, succeeded: 1, failed: 1, skipped: 1, settled: 2, running: 2 }),
        analyzers: [
          run('techniques', 'succeeded', { result: { detected: [] } }),
          run('claims', 'failed', { error: { code: 'timeout', message: 'slow' }, availability: 'unavailable', note: 'The analyzer did not answer in time.' }),
          run('entities', 'skipped', { reason: 'not_applicable', availability: 'not_applicable', note: 'Not run: this analyzer does not apply to this kind of input.' }),
        ],
      }),
    )
    toggle()
    expect(screen.getByText('1 succeeded · 1 failed · 1 skipped of 3 applicable')).toBeInTheDocument()
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '50%' })
    expect(within(screen.getByText('claims analyzer').closest('li') as HTMLElement).getByText('Timed out')).toBeInTheDocument()
    expect(screen.getByText('Unavailable: the analyzer failed or is not set up, so its result is missing.')).toBeInTheDocument()
    expect(screen.getByText('Not run: this analyzer does not apply to this kind of input.')).toBeInTheDocument()
    expect(screen.queryByText('Analysis failed')).toBeNull() // analyzer failure never fails the job
  })

  it('shows a plain failure code, and treats an unknown availability as unavailable', async () => {
    await show(job({ analyzers: [run('claims', 'failed', { error: { code: 'adapter_error', message: 'x' } }), run('entities', 'succeeded', { availability: 'partial' })] }))
    toggle()
    const claims = screen.getByText('claims analyzer').closest('li') as HTMLElement
    expect(within(claims).getByText('Failed')).toBeInTheDocument()
    expect(within(claims).getByText('adapter_error')).toBeInTheDocument()
    expect(within(screen.getByText('entities analyzer').closest('li') as HTMLElement).getByText('Unavailable')).toBeInTheDocument()
  })

  it('collapses disabled and not_selected runs under "Not run"', async () => {
    await show(job({ analyzers: [run('a', 'skipped', { reason: 'disabled' }), run('b', 'skipped', { reason: 'not_selected' }), run('c', 'succeeded')] }))
    toggle()
    const details = screen.getByText('Not run (2)').closest('details') as HTMLElement
    expect(within(details).getByText('a analyzer')).toBeInTheDocument()
    expect(within(details).getByText('b analyzer')).toBeInTheDocument()
    expect(within(details).queryByText('c analyzer')).toBeNull()
    expect(screen.getByText('c analyzer').closest('details')).toBeNull()
  })
})

describe('Results: page chrome, mock parts and polling', () => {
  it('shows the job id and duration, and no model or latency', async () => {
    await show(job())
    const meta = document.querySelector('.meta-row') as HTMLElement
    expect(meta).toHaveTextContent('Job j1')
    expect(meta).toHaveTextContent('Duration 3.2 s')
    expect(screen.queryByText(/Model:|latency/i)).toBeNull()
    expect(screen.queryByRole('link', { name: 'Watch live progress' })).toBeNull()
  })

  it('wraps only the mock parts in Mock', async () => {
    await show(job())
    toggle()
    for (const el of [screen.getByText(/Polarity: /), screen.getByText('High rhetorical bias factor'), screen.getByRole('button', { name: 'Share' })])
      expect(inMock(el)).not.toBeNull()
    for (const el of [
      screen.getByRole('button', { name: 'Copy' }),
      screen.getByRole('link', { name: 'Open detailed analysis page' }),
      screen.getByRole('link', { name: 'Ask VEIL' }),
      screen.getByText('Job j1'),
      screen.getByText('1 succeeded · 1 failed · 1 skipped of 2 applicable'),
    ])
      expect(inMock(el)).toBeNull()
  })

  it('links to the detail view and coverage, and copies the page URL', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await show(job())
    toggle()
    expect(screen.getByRole('link', { name: 'Open detailed analysis page' })).toHaveAttribute('href', '/jobs/j1/detail')
    expect(screen.getByRole('link', { name: 'Explore coverage' })).toHaveAttribute('href', '/explore?job=j1')
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('polls every 2000 ms while not done, shows the live link, then stops', async () => {
    vi.useFakeTimers()
    fetchMock
      .mockResolvedValueOnce(json(job({ status: 'running', done: false, finished_at: null, finalization: finalization('pending') })))
      .mockResolvedValueOnce(json(job()))
    render(<ResultsView id="j1" />)
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(screen.getByRole('link', { name: 'Watch live progress' })).toHaveAttribute('href', '/jobs/j1/live')
    await act(() => vi.advanceTimersByTimeAsync(1999))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('link', { name: 'Watch live progress' })).toBeNull()
    await act(() => vi.advanceTimersByTimeAsync(10000))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('shows a loading skeleton, then "Job not found" for a 404 and stops polling', async () => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValue(json({ error: { code: 'not_found', message: 'job not found' } }, 404))
    render(<ResultsView id="nope" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(screen.getByRole('alert')).toHaveTextContent('Job not found')
    await act(() => vi.advanceTimersByTimeAsync(10000))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shows other error envelopes through the foundation mapping', async () => {
    fetchMock.mockResolvedValue(json({ error: { code: 'internal_error', message: 'boom' } }, 500))
    render(<ResultsView id="j1" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on the server')
  })
})

describe('Results in another locale', () => {
  const full = (extra: Record<string, unknown> = {}) =>
    job({
      analyzers: [run('claims', 'failed', { error: { code: 'adapter_error', message: 'x' } }), run('odd', 'weird_status'), run('t', 'succeeded', { availability: 'partial' })],
      finalization: finalization('completed', { result: assessment({ verdict: 'detected', confidence: 0.86, user_text: 'Der Text <b>drängt</b> {count}', ...extra }) }),
    })

  it('renders German chrome and keeps API content and raw unknown values unchanged', async () => {
    fetchMock.mockResolvedValue(json(full()))
    inLocale('de', <ResultsView id="j1" />)
    expect(await screen.findByRole('heading', { level: 2, name: 'Ja, Propaganda erkannt.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Ergebnisse', hidden: true })).toBeInTheDocument()
    expect(verdictEl()).toHaveTextContent(/86\s?% Konfidenz/)
    expect(screen.getByText('Der Text <b>drängt</b> {count}')).toBeInTheDocument()
    expect(document.querySelector('.meta-row')).toHaveTextContent('Auftrag j1')
    expect(document.querySelector('.meta-row')).toHaveTextContent('Dauer 3,2 s')
    fireEvent.click(screen.getByRole('button', { name: 'Detaillierte Analyse anzeigen' }))
    expect(screen.getByRole('region', { name: 'Detaillierte Analyse' })).toBeInTheDocument()
    expect(screen.getByText('Analysatorabdeckung', { selector: 'h3' })).toBeInTheDocument()
    expect(screen.getByText('weird_status')).toBeInTheDocument() // unknown status: raw
    expect(screen.getByText('adapter_error')).toBeInTheDocument()
    expect(screen.getByText('Fehlgeschlagen')).toBeInTheDocument()
  })

  it('formats a percentage per locale: fr puts a non-breaking space before %', async () => {
    fetchMock.mockResolvedValue(json(full()))
    inLocale('fr', <ResultsView id="j1" />)
    await screen.findByRole('heading', { level: 2 })
    expect(verdictEl().textContent).toMatch(/86[\u00a0\u202f]%/)
  })

  it('re-renders without a reload when the language changes, and mirrors the page in Arabic', async () => {
    fetchMock.mockResolvedValue(json(full()))
    inLocale('en', <><Switch to="ar" /><ResultsView id="j1" /></>)
    await screen.findByRole('heading', { level: 2, name: 'Yes, propaganda detected.' })
    fireEvent.click(screen.getByRole('button', { name: 'switch' }))
    expect(screen.getByRole('heading', { level: 2, name: 'نعم، تم اكتشاف دعاية.' })).toBeInTheDocument()
    expect(screen.getByText('Der Text <b>drängt</b> {count}')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
  })

  it('translates the state cards and keeps the API error message', async () => {
    fetchMock.mockResolvedValue(json(job({ status: 'failed', finalization: null, scrape: { status: 'failed', error: { code: 'x_code', message: 'API says <i>no</i>' } } })))
    inLocale('de', <ResultsView id="j1" />)
    expect(await screen.findByText('Abruf fehlgeschlagen')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'API says <i>no</i>' })).toBeInTheDocument()
    expect(screen.getByText('Fehlercode: x_code')).toBeInTheDocument()
  })
})

describe('Results: verdict info cards in the initial view', () => {
  const CONTENT = 'Everyone knows these people are destroying our future.'
  const strong = () =>
    job({
      input: { content: CONTENT },
      analyzers: [
        run('techniques', 'succeeded', {
          result: {
            detected: [
              { name: 'Doubt', display: 'Doubt', strength: 'weak' },
              { name: 'Loaded_Language', display: 'Loaded Language', strength: 'strong', spans: [{ technique: 'Loaded_Language', text: 'destroying', start: 32, end: 42 }] },
            ],
          },
        }),
        run('fact_check', 'succeeded', { result: { fact_checks: [{}, {}] } }),
      ],
    })

  it('shows only the top technique, the passage count and the fact-check count, and no tags or tables', async () => {
    await show(strong())
    const cards = [...document.querySelectorAll('.info-card')].map((c) => c.textContent)
    expect(cards).toEqual(['Top techniqueLoaded LanguageDetected', 'Evidence1 passageLocated', 'Fact-checks2 matchesRelated checks found'])
    expect(screen.getAllByText('Loaded Language')).toHaveLength(1)
    expect(screen.queryByText('Doubt')).toBeNull()
    expect(document.querySelector('.tags, table, .coverage-card')).toBeNull()
    expect(screen.queryByRole('region', { name: 'Detailed analysis' })).toBeNull()
    expect(screen.getByRole('button', { name: 'View detailed analysis' })).toHaveClass('btn-primary')
    expect(screen.getByRole('link', { name: 'Ask VEIL' })).toHaveAttribute('href', '/jobs/j1/ask')
  })

  it('shows no card for missing runs and "Unavailable" for a failed fact-check', async () => {
    await show(job({ analyzers: [] }))
    expect(document.querySelector('.verdict-cards')).toBeNull()
    cleanup()
    await show(job({ analyzers: [run('fact_check', 'failed')] }))
    expect([...document.querySelectorAll('.info-card')].map((c) => c.textContent)).toEqual(['Fact-checksUnavailable'])
  })

  it('does not claim a fact-check confirms the verdict', async () => {
    await show(strong())
    expect(verdictEl().textContent).not.toMatch(/confirm/i)
  })
})

describe('Results verdict card in Arabic', () => {
  it('renders Arabic strings with dir=rtl and Intl numbers', async () => {
    fetchMock.mockResolvedValue(
      json(
        job({
          input: { content: 'Everyone knows these people are destroying our future.' },
          analyzers: [run('techniques', 'succeeded', { result: { detected: [{ name: 'Loaded_Language', display: 'x', strength: 'strong', spans: [{ technique: 'Loaded_Language', text: 'destroying', start: 32, end: 42 }] }] } })],
          finalization: finalization('completed', { result: assessment({ verdict: 'detected', confidence: 0.86, user_text: 'هل هذا النص يضغط على القارئ؟ نعم، يفعل ذلك.' }) }),
        }),
      ),
    )
    inLocale('ar', <ResultsView id="j1" />)
    expect(await screen.findByRole('heading', { level: 2, name: 'نعم، تم اكتشاف دعاية.' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    const el = verdictEl()
    expect(el.querySelector('.verdict-pill')).toHaveTextContent('تم اكتشاف دعاية')
    expect(el.querySelector('.verdict-summary')).toHaveTextContent('هل هذا النص يضغط على القارئ؟')
    expect(el.querySelector('.verdict-summary')).toHaveAttribute('dir', 'auto')
    expect(el.querySelector('.verdict-confidence')?.textContent?.replace(/\s/g, '')).toContain(new Intl.NumberFormat('ar', { style: 'percent' }).format(0.86).replace(/\s/g, ''))
    expect([...el.querySelectorAll('.info-card-label')].map((l) => l.textContent)).toEqual(['أبرز أسلوب', 'الأدلة', 'الأساليب'])
    expect(within(el).getByRole('button', { name: 'قراءة الشرح الكامل' })).toHaveAttribute('aria-expanded', 'false')
    expect(el.querySelector('.info-card:nth-child(2) .info-card-value')?.textContent).toBe(`${new Intl.NumberFormat('ar').format(1)} مقطع`) // Intl digits
  })
})

describe('Results: risk score placement', () => {
  it('has no risk section in the results stack and shows it inside the expanded detailed region after the technique list', async () => {
    await show(job({ risk: risk() }))
    expect(document.querySelector('.results-stack > .risk')).toBeNull()
    expect(document.querySelector('.results-stack')?.firstElementChild).toBe(verdictEl())
    expect(document.querySelector('.risk')).toBeNull()
    toggle()
    const region = screen.getByRole('region', { name: 'Detailed analysis' })
    const section = region.querySelector('.risk') as HTMLElement
    expect(section).not.toBeNull()
    expect(section.previousElementSibling).toBe(region.querySelector('.tech-list'))
    expect(within(section).getByRole('heading', { name: 'Manipulation Risk Score' })).toBeInTheDocument()
  })

  it.each([['null', { risk: null }], ['missing', {}]])('shows no risk overview and no error when risk is %s', async (_n, extra) => {
    await show(job(extra))
    toggle()
    expect(document.querySelector('.risk')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(verdictEl()).not.toBeNull()
  })
})
