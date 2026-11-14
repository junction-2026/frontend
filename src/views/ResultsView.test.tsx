import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { assessment, coverage, finalization, job, json, run } from '../job/fixtures'
import ResultsView from './ResultsView'

const fetchMock = vi.fn()
beforeEach(() => vi.stubGlobal('fetch', fetchMock))
afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

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
    ['detected', 'Yes, propaganda detected.', 'VEIL identified signs of manipulative messaging in this content.'],
    ['not_detected', 'No clear signs of propaganda.', 'VEIL did not identify strong indicators of propaganda in this content.'],
    ['uncertain', "We're not sure yet.", 'The available evidence is insufficient or conflicting.'],
    ['suspicious', "We're not sure yet.", 'The available evidence is insufficient or conflicting.'], // unknown reads as uncertain
  ])('shows verdict %s', async (verdict, heading, body) => {
    const h = await show(withResult({ verdict }))
    const el = verdictEl()
    expect(document.querySelectorAll('[data-verdict]')).toHaveLength(1)
    expect(el.tagName).toBe('SECTION')
    expect(el.dataset.verdict).toBe(verdict === 'suspicious' ? 'uncertain' : verdict)
    expect(el).toContainElement(h)
    expect(h).toHaveTextContent(heading)
    expect(el).toHaveTextContent(body)
    expect(el).toHaveTextContent('This text pressures the reader.')
    expect(inMock(h)).toBeNull()
  })

  it('chooses the state only from the verdict, never from confidence', async () => {
    await show(withResult({ verdict: 'not_detected', confidence: 0.99 }))
    expect(verdictEl().dataset.verdict).toBe('not_detected')
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

  it('shows user_text literally as a text node', async () => {
    const text = '<b>fake</b> [click](https://example.com) http://example.com'
    await show(withResult({ user_text: text }))
    expect(screen.getByText(text)).toBeInTheDocument()
    expect(verdictEl().querySelector('b, a')).toBeNull()
    expect(screen.getByText(text)).toHaveClass('verdict-user-text')
  })

  it('shortens user_text over 280 code points and expands it in place', async () => {
    const text = `${'😀'.repeat(279)}ab${long(10)}`
    await show(withResult({ user_text: text }))
    const btn = screen.getByRole('button', { name: 'Show full explanation' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(text)).toBeNull()
    expect(screen.getByText(`${'😀'.repeat(279)}a…`)).toBeInTheDocument()
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('shows user_text of exactly 280 code points in full without a button', async () => {
    await show(withResult({ user_text: '😀'.repeat(280) }))
    expect(screen.getByText('😀'.repeat(280))).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show full explanation' })).toBeNull()
  })

  it('labels an orchestrator uncertain result as insufficient evidence', async () => {
    await show(withResult({ verdict: 'uncertain', confidence: null, produced_by: 'orchestrator' }))
    expect(within(verdictEl()).getByText('Insufficient evidence')).toBeInTheDocument()
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
    expect(screen.getByRole('link', { name: 'Ask VEIL' })).toHaveAttribute('href', '/ask')
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
    expect(screen.getByText(`“${long(400)}…”`)).toBeInTheDocument()
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
    expect(screen.getByText('techniques analyzer')).toBeInTheDocument()
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
    expect(screen.getByText('techniques analyzer')).toBeInTheDocument()
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
    expect(screen.getByText('techniques analyzer')).toBeInTheDocument()
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
    expect(screen.getByText('The analyzer did not answer in time.')).toBeInTheDocument()
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
