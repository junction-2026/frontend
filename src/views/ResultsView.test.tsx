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

describe('Results: verdict card', () => {
  it.each([
    ['detected', 'Manipulation detected', 'red'],
    ['not_detected', 'No manipulation indicators', 'green'],
    ['uncertain', 'Uncertain', 'orange'],
    ['suspicious', 'Uncertain', 'orange'], // unknown verdict reads as uncertain
  ])('shows verdict %s as a "%s" banner coloured %s', async (verdict, label, colour) => {
    const h = await show(withResult({ verdict }))
    expect(h).toHaveTextContent(label)
    expect(h.parentElement).toHaveClass('verdict-banner', colour)
    expect(document.querySelector('.verdict-card .status-pill')).toBeNull()
    expect(inMock(h)).toBeNull()
  })

  it('does not show user_text or a confidence number', async () => {
    const text = '<b>fake</b> [click](https://example.com) http://example.com'
    await show(withResult({ user_text: text, confidence: 0.86 }))
    expect(screen.queryByText(text)).toBeNull()
    expect(document.body).not.toHaveTextContent('fake')
    expect(screen.queryByText(/0\.86|86 ?%/)).toBeNull()
    expect(screen.queryByText(/confidence/i)).toBeNull()
  })

  it('labels an orchestrator result as insufficient evidence next to the banner', async () => {
    const h = await show(withResult({ verdict: 'uncertain', confidence: null, produced_by: 'orchestrator', user_text: 'Nothing could be checked.' }))
    expect(screen.queryByText('Nothing could be checked.')).toBeNull()
    expect(h).toHaveTextContent('Uncertain')
    expect(screen.getByText('Insufficient evidence')).toBeInTheDocument()
  })

  it('lists one tag per detected technique without scores', async () => {
    await show(
      job({
        analyzers: [
          techniques([
            { name: 'Loaded_Language', display: 'Loaded Language', score: 0.91, strength: 'high' },
            { name: 'Doubt', display: 'Doubt', plain_language: { name: 'Zweifel' }, score: 0.5 },
          ]),
        ],
      }),
    )
    const tags = document.querySelector('.tags') as HTMLElement
    expect([...tags.children].map((t) => t.textContent)).toEqual(['Loaded Language', 'Zweifel'])
    expect(screen.queryByText(/0\.91|91 ?%|\(0\./)).toBeNull()
  })

  it('shows no technique tags for a failed techniques run', async () => {
    await show(job({ analyzers: [techniques([{ name: 'Doubt', display: 'Doubt' }], 'failed')] }))
    expect(document.querySelector('.tags')).toBeNull()
  })
})

describe('Results: finalization and job states', () => {
  const analyzers = [run('techniques', 'succeeded', { result: { detected: [] } })]

  it.each([['pending'], ['running']])('shows progress while finalization is %s, with analyzers visible', async (status) => {
    await show(job({ status: 'finalizing', done: false, finalization: finalization(status), analyzers }))
    expect(screen.getByText('Final assessment in progress')).toBeInTheDocument()
    expect(screen.getByText('techniques analyzer')).toBeInTheDocument()
    expect(document.querySelector('.verdict-banner')).toBeNull()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('The analyzers are still working.')
  })

  it.each([
    ['not_configured', 'No final assessment configured'],
    ['disabled_by_request', 'Final assessment turned off for this job'],
    ['cancelled', 'Final assessment cancelled'],
  ])('shows the reason of a skipped finalization (%s)', async (reason, text) => {
    await show(job({ finalization: finalization('skipped', { reason }), analyzers }))
    expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.getByText('techniques analyzer')).toBeInTheDocument()
    expect(screen.queryByText('Analysis failed')).toBeNull()
    expect(document.querySelector('.verdict-banner')).toBeNull()
    expect(screen.getByText('Final assessment skipped')).toHaveClass('status-pill', 'gray')
  })

  it('shows "No final assessment" for a done job without a finalization result', async () => {
    await show(job({ finalization: finalization('pending') }))
    expect(screen.getByText('No final assessment')).toHaveClass('status-pill', 'gray')
    expect(document.querySelector('.verdict-banner')).toBeNull()
  })

  it('shows a failed finalization with its code, and Timed out for timeout', async () => {
    await show(job({ finalization: finalization('failed', { error: { code: 'adapter_error', message: 'x' } }), analyzers }))
    expect(screen.getByText('Final assessment failed')).toBeInTheDocument()
    expect(screen.getByText('adapter_error')).toBeInTheDocument()
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
    expect(screen.getByText('Error code: account_private')).toBeInTheDocument()
    expect(document.querySelector('h2 i')).toBeNull()
  })

  it('shows "Analysis failed" for any other failed job', async () => {
    await show(job({ status: 'failed', finalization: finalization('skipped') }))
    expect(screen.getByText('Analysis failed')).toBeInTheDocument()
  })

  it('shows Cancelled and keeps the settled runs', async () => {
    await show(job({ status: 'cancelled', finalization: finalization('skipped', { reason: 'cancelled' }), analyzers: [run('techniques', 'succeeded', { result: { detected: [] } }), run('claims', 'failed', { error: { code: 'cancelled', message: 'x' } })] }))
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(screen.getByText('techniques analyzer')).toBeInTheDocument()
    expect(screen.getByText('claims analyzer')).toBeInTheDocument()
  })

  it('judges an unknown status by done', async () => {
    await show(job({ status: 'archived', done: true, finalization: finalization('completed', { result: assessment() }) }))
    expect(screen.getByText('Manipulation detected')).toBeInTheDocument()
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
    expect(screen.getByText('1 succeeded · 1 failed · 1 skipped of 3 applicable')).toBeInTheDocument()
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '50%' })
    expect(within(screen.getByText('claims analyzer').closest('li') as HTMLElement).getByText('Timed out')).toBeInTheDocument()
    expect(screen.getByText('The analyzer did not answer in time.')).toBeInTheDocument()
    expect(screen.getByText('Not run: this analyzer does not apply to this kind of input.')).toBeInTheDocument()
    expect(screen.queryByText('Analysis failed')).toBeNull() // analyzer failure never fails the job
  })

  it('shows a plain failure code, and treats an unknown availability as unavailable', async () => {
    await show(job({ analyzers: [run('claims', 'failed', { error: { code: 'adapter_error', message: 'x' } }), run('entities', 'succeeded', { availability: 'partial' })] }))
    const claims = screen.getByText('claims analyzer').closest('li') as HTMLElement
    expect(within(claims).getByText('Failed')).toBeInTheDocument()
    expect(within(claims).getByText('adapter_error')).toBeInTheDocument()
    expect(within(screen.getByText('entities analyzer').closest('li') as HTMLElement).getByText('Unavailable')).toBeInTheDocument()
  })

  it('collapses disabled and not_selected runs under "Not run"', async () => {
    await show(job({ analyzers: [run('a', 'skipped', { reason: 'disabled' }), run('b', 'skipped', { reason: 'not_selected' }), run('c', 'succeeded')] }))
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
    for (const el of [
      screen.getByText(/Polarity: /),
      screen.getByText('High rhetorical bias factor'),
      screen.getByRole('button', { name: 'Share' }),
      screen.getByText(/Open Ask VEIL Conversation/),
    ])
      expect(inMock(el)).not.toBeNull()
    for (const el of [
      screen.getByRole('button', { name: 'Copy' }),
      screen.getByRole('link', { name: /Explore full analysis/ }),
      screen.getByText('Job j1'),
      screen.getByText('1 succeeded · 1 failed · 1 skipped of 2 applicable'),
    ])
      expect(inMock(el)).toBeNull()
  })

  it('links to the detail view and coverage, and copies the page URL', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await show(job())
    expect(screen.getByRole('link', { name: /Explore full analysis/ })).toHaveAttribute('href', '/jobs/j1/detail')
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
