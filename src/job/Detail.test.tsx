import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DetailView from '../views/DetailView'
import { risk } from './fixtures'

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
  analyzers: [{ id: 'techniques', name: 'Technique classifier', status: 'succeeded', result }],
  ...extra,
})
const show = async (j: unknown) => {
  fetchMock.mockResolvedValue(json(j))
  render(<DetailView id="j1" />)
  return screen.findByTestId('job-text')
}
const marks = (el: HTMLElement) => [...el.querySelectorAll('mark')]

describe('job result view (Detail)', () => {
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
    const text = await show(job(c, null, { analyzers: [{ id: 'techniques', name: 'Technique classifier', status: 'failed', result: null }] }))
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
    render(<DetailView id="j1" />)
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
    const { unmount } = render(<DetailView id="j1" />)
    await act(() => vi.advanceTimersByTimeAsync(0))
    unmount()
    await act(() => vi.advanceTimersByTimeAsync(10000))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shows an alert for 404 and for a network error, without polling', async () => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValue(json({ error: { code: 'not_found' } }, 404))
    const { unmount } = render(<DetailView id="nope" />)
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(screen.getByRole('alert')).toHaveTextContent(/not found/i)
    await act(() => vi.advanceTimersByTimeAsync(10000))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    unmount()
    fetchMock.mockReset()
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<DetailView id="nope" />)
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not reach the backend/)
    await act(() => vi.advanceTimersByTimeAsync(10000))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  describe('plain language and LLM techniques', () => {
    const pl = { name: 'Geladene Sprache', definition: 'Worte mit starkem Gefühlsdruck.', why: 'WHY-DOC' }
    const llmRun = (findings: unknown[], status = 'succeeded') => ({
      id: 'llm_techniques',
      name: 'LLM technique detection',
      status,
      result: status === 'succeeded' ? { source: 'llm', findings } : null,
    })
    const finding = (label: string, field: string, text: string, from: string, extra: object = {}) => ({
      label,
      name: `N-${label}`,
      definition: `D-${label}`,
      explanation: `E-${label}`,
      confidence: 0.87,
      source: 'llm',
      span: { field, text, start: from.indexOf(text), end: from.indexOf(text) + text.length },
      ...extra,
    })
    const withLlm = (j: ReturnType<typeof job>, run: unknown) => ({ ...j, analyzers: [...j.analyzers, run] })

    it('shows plain_language name and definition, span why on focus, and detection why without spans', async () => {
      const c = 'Sie LÜGEN euch an. Zweiter Satz.'
      const s = { ...span('Loaded_Language', c, 'LÜGEN euch'), why: 'WHY-SPAN <b>x</b>' }
      const text = await show(
        job(c, {
          span_status: 'ok',
          detected: [
            { ...det('Loaded_Language', [s]), plain_language: { ...pl, why: 'WHY-FIRST' } },
            { ...det('Doubt', []), plain_language: { name: 'Zweifel', definition: 'DEF-Z', why: 'WHY-NOSPAN' } },
          ],
        }),
      )
      const b = screen.getByRole('button', { name: /Geladene Sprache.*Gefühlsdruck/ })
      expect(b).not.toHaveTextContent('explained')
      expect(screen.getByRole('button', { name: /Zweifel.*DEF-Z.*no exact phrase found/ })).toBeInTheDocument()
      expect(screen.getByText('WHY-NOSPAN')).toBeInTheDocument()
      expect(screen.queryByText('WHY-FIRST')).toBeNull()
      expect(screen.queryByRole('region')).toBeNull()
      const mark = marks(text)[0]
      expect(mark).not.toHaveAttribute('aria-describedby')
      fireEvent.focus(mark)
      const region = screen.getByRole('region')
      expect(region).toHaveTextContent('WHY-SPAN <b>x</b>') // literal markup
      expect(region.querySelector('b')).toBeNull()
      expect(mark).toHaveAttribute('aria-describedby', region.id)
      fireEvent.blur(mark)
      expect(screen.queryByRole('region')).toBeNull()
    })

    it('renders a stored result without plain_language or why exactly as before', async () => {
      const c = 'They are LYING.'
      const text = await show(job(c, { span_status: 'ok', detected: [det('Doubt', [span('Doubt', c, 'LYING')])] }))
      expect(screen.getByRole('button', { name: /Doubt.*Doubt explained.*1 phrase/ })).toBeInTheDocument()
      fireEvent.focus(marks(text)[0])
      expect(screen.queryByRole('region')).toBeNull()
      expect(marks(text)[0]).not.toHaveAttribute('aria-describedby')
      expect(screen.queryByText(/AI-assessed/)).toBeNull()
      expect(screen.queryByTestId('job-title')).toBeNull()
    })

    it('lists LLM findings in a separate weaker group, with literal text and no confidence', async () => {
      const c = 'Crime rose <b>300%</b> in May. Surely true.'
      const f = { ...finding('statistical_cherry_picking', 'content', '<b>300%</b>', c), explanation: '<i>E</i> **x**' }
      const text = await show(withLlm(job(c, { span_status: 'ok', detected: [det('Doubt', [])] }), llmRun([f])))
      const h = screen.getByRole('heading', { name: 'Other possible issues (AI-assessed, less reliable)' })
      const section = h.closest('section') as HTMLElement
      expect(section).toHaveTextContent('N-statistical_cherry_picking')
      expect(section).toHaveTextContent('D-statistical_cherry_picking')
      expect(section).toHaveTextContent('<i>E</i> **x**')
      expect(section.querySelector('blockquote')).toHaveTextContent('<b>300%</b>')
      expect(section.querySelector('i, b, strong i')).toBeNull()
      expect(screen.getByText(/less reliable than/)).toBeInTheDocument()
      expect(screen.queryByText(/0\.87|87/)).toBeNull()
      expect(screen.queryByRole('button', { name: /N-statistical/ })).toBeNull()
      const m = marks(text)
      expect(m.map((x) => x.textContent)).toEqual(['<b>300%</b>'])
      expect(m[0]).toHaveAttribute('data-llm', 'true')
      fireEvent.focus(m[0])
      expect(screen.getByRole('region')).toHaveTextContent('<i>E</i> **x**')
    })

    it('highlights title spans with non-BMP characters in the shown title', async () => {
      const c = 'Body text here.'
      const t = '😡 Vaccine KILLS thousands'
      const f = finding('misleading_headline', 'title', 'KILLS thousands', t)
      expect(t.slice(f.span.start, f.span.end)).toBe('KILLS thousands')
      await show(
        withLlm(job(c, { detected: [] }, { input: { content: c, source: { title: t } } }), llmRun([f])),
      )
      const title = screen.getByTestId('job-title')
      expect(title.textContent).toBe(t)
      expect(marks(title).map((x) => x.textContent)).toEqual(['KILLS thousands'])
      expect(marks(screen.getByTestId('job-text'))).toHaveLength(0)
    })

    it('lists a finding with mismatched offsets without highlight and ignores unknown labels', async () => {
      const c = 'Certainly everything is proven.'
      const bad = finding('evidence_certainty_mismatch', 'content', 'proven', c)
      bad.span.start += 1
      const unknown = finding('fabricated_authority', 'content', 'proven', c)
      const text = await show(withLlm(job(c, { detected: [] }), llmRun([bad, unknown])))
      expect(marks(text)).toHaveLength(0)
      expect(screen.getByText('N-evidence_certainty_mismatch')).toBeInTheDocument()
      expect(screen.queryByText(/fabricated_authority/)).toBeNull()
    })

    it('shows the unavailable note only for a failed or skipped llm run', async () => {
      const base = job('abc', { detected: [] })
      for (const status of ['failed', 'skipped']) {
        await show(withLlm(base, llmRun([], status)))
        expect(screen.getByText('AI-assessed check not available')).toBeInTheDocument()
        cleanup()
      }
      await show(withLlm(base, llmRun([])))
      expect(screen.queryByText(/AI-assessed/)).toBeNull()
      cleanup()
      await show(base)
      expect(screen.queryByText(/AI-assessed/)).toBeNull()
    })
  })
  describe('Detail screen', () => {
    const topic = (claims: unknown, status = 'succeeded') => ({ id: 'topic_extraction', name: 'Topic extraction', status, result: status === 'succeeded' ? { topics: [], news: [], claims } : null })
    const metric = (label: string) => (screen.getByText(label).parentElement as HTMLElement).querySelector('strong') as HTMLElement
    const inMock = (el: HTMLElement) => el.closest('[data-mock]')

    it('shows Patterns, Claims, Risk and Latency as real values, with no confidence', async () => {
      const c = 'They are LYING.'
      const j = job(c, { span_status: 'ok', detected: [det('Doubt', []), det('Loaded_Language', [])] }, { finalization: { status: 'completed', result: { verdict: 'detected', confidence: 0.86, user_text: 'x' } } })
      await show({ ...j, analyzers: [...j.analyzers, topic([{ text: 'a' }, { text: 'b' }, { text: 'c' }])] })
      expect(metric('Patterns')).toHaveTextContent('2 detected')
      expect(metric('Claims')).toHaveTextContent('3 extracted')
      expect(inMock(metric('Patterns'))).toBeNull()
      expect(inMock(metric('Claims'))).toBeNull()
      expect(metric('Risk')).toHaveTextContent('—')
      expect(metric('Latency')).toHaveTextContent('—') // fixture job has no finished_at
      expect(screen.queryByText(/412/)).toBeNull()
      expect(document.querySelector('[data-mock]')).toBeNull()
      expect(screen.queryByText(/confidence|0\.86|86 ?%/i)).toBeNull()
      expect(screen.getByRole('link', { name: /Back to summary/ })).toHaveAttribute('href', '/jobs/j1')
    })

    describe('Latency', () => {
      const timed = (created_at: string, finished_at: string | null, done = true) => job('They are LYING.', { span_status: 'ok', detected: [det('Doubt', [])] }, { created_at, finished_at, done })
      const C = '2026-11-14T10:00:00Z'
      it.each([
        ['a seconds-scale job', C, '2026-11-14T10:00:03.200Z', '3.2 s'],
        ['an under-1-s job', C, '2026-11-14T10:00:00.284Z', '284 ms'],
        ['an unfinished job', C, null, '—'],
        ['an unparseable timestamp', 'nope', '2026-11-14T10:00:03Z', '—'],
        ['a negative span', C, '2026-11-14T09:59:59Z', '—'],
      ])('shows %s as %s, with no Mock ancestor', async (_n, created, finished, text) => {
        await show(timed(created, finished, finished !== null))
        const latency = metric('Latency')
        expect(latency).toHaveTextContent(text)
        expect(latency.textContent).toBe(text)
        expect(inMock(latency)).toBeNull()
        expect(screen.queryByText(/412/)).toBeNull()
      })
    })

    describe('Risk cell and overview', () => {
      const withRisk = (r: unknown) => job('They are LYING.', { span_status: 'ok', detected: [det('Doubt', [])] }, { risk: r })
      const riskCell = () => (screen.getByText('Risk', { selector: '.metrics-bar span' }).parentElement as HTMLElement).querySelector('strong') as HTMLElement

      it('shows the percentage and band chip for a scored risk, not inside Mock', async () => {
        await show(withRisk(risk({ score: 0.72, band: 'high' })))
        expect(riskCell()).toHaveTextContent('72%')
        expect(riskCell()).toHaveTextContent('High risk')
        expect(riskCell().querySelector('.risk-chip')).toHaveAttribute('data-band', 'high')
        expect(inMock(riskCell())).toBeNull()
        expect(riskCell().parentElement?.querySelector('[data-mock]')).toBeNull()
      })

      it.each([
        ['unavailable', risk({ status: 'unavailable', reason: 'no_content_signals', score: null, band: null, drivers: [] })],
        ['scored without drivers', risk({ drivers: [] })],
        ['unknown status', risk({ status: 'weird' })],
        ['null', null],
        ['missing', undefined],
      ])('shows — when risk is %s', async (_n, r) => {
        await show(withRisk(r))
        expect(riskCell()).toHaveTextContent(/^—$/)
      })

      it('shows an unknown band by its id with moderate colours', async () => {
        await show(withRisk(risk({ band: 'extreme' })))
        expect(riskCell().querySelector('.risk-chip')).toHaveTextContent('extreme')
        expect(riskCell().querySelector('.risk-chip')).toHaveAttribute('data-band', 'moderate')
      })

      it('renders the overview after the technique-list card and before the LLM group, and not when risk is missing', async () => {
        const j = withRisk(risk()) as { analyzers: unknown[] }
        j.analyzers.push({ id: 'llm_techniques', name: 'LLM', status: 'failed', result: null })
        await show(j)
        const overview = document.querySelector('.risk') as HTMLElement
        expect(overview.previousElementSibling).toBe(document.querySelector('.tech-list'))
        expect(overview.nextElementSibling).toBe(document.querySelector('.job-llm-group'))
        expect(overview.querySelector('.risk-score')).toBeNull()
        cleanup()
        await show(withRisk(undefined))
        expect(document.querySelector('.risk')).toBeNull()
      })
    })

    it('shows — when the techniques or topic_extraction run did not succeed, and counts a result without claims as none', async () => {
      const j = job('abc', null, { analyzers: [{ id: 'techniques', name: 't', status: 'failed', result: null }, topic(null, 'failed')] })
      await show(j)
      expect(metric('Patterns')).toHaveTextContent('—')
      expect(metric('Claims')).toHaveTextContent('—')
      cleanup()
      await show({ ...j, analyzers: [{ id: 'topic_extraction', name: 't', status: 'succeeded', result: { topics: [] } }] })
      expect(metric('Claims')).toHaveTextContent('0 extracted')
    })

    it('shows Detection.name as ID badge and no match percentage', async () => {
      const c = 'They are LYING.'
      await show(job(c, { span_status: 'ok', detected: [{ ...det('Loaded_Language', [span('Loaded_Language', c, 'LYING')]), score: 0.96 }] }))
      expect(screen.getByText('ID: Loaded_Language')).toHaveClass('badge-soft')
      expect(screen.queryByText(/Match|96/)).toBeNull()
      expect(screen.getByText('LYING', { selector: 'bdi' }).closest('.anchor')).toHaveTextContent('Excerpt anchor: “LYING”')
    })
  })
})
