import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { assessment, finalization, job, json } from '../job/fixtures'
import DetailView from './DetailView'

const fetchMock = vi.fn()
beforeEach(() => vi.stubGlobal('fetch', fetchMock))
afterEach(() => {
  cleanup()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

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
