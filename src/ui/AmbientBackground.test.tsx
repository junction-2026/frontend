import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HistoryView from '../views/HistoryView'
import AnalyzingView from '../views/AnalyzingView'
import HomeView from '../views/HomeView'
import { AmbientBackground } from './AmbientBackground'

describe('AmbientBackground', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
    window.history.replaceState(null, '', '/')
  })
  afterEach(() => vi.unstubAllGlobals())

  it('is one hidden container with 5-7 blobs and nothing interactive', () => {
    const { container } = render(<AmbientBackground />)
    const layers = container.querySelectorAll('.ambient-bg')
    expect(layers).toHaveLength(1)
    expect(layers[0]).toHaveAttribute('aria-hidden', 'true')
    const blobs = layers[0].querySelectorAll('.ambient-blob')
    expect(blobs.length).toBeGreaterThanOrEqual(5)
    expect(blobs.length).toBeLessThanOrEqual(7)
    expect(layers[0].textContent).toBe('')
    expect(layers[0].querySelector('a, button, input, [tabindex]')).toBeNull()
  })

  it('is mounted by HomeView as a sibling before .view', () => {
    const { container } = render(<HomeView />)
    expect(container.querySelectorAll('.ambient-bg')).toHaveLength(1)
    expect(container.querySelector('.ambient-bg')!.nextElementSibling).toBe(container.querySelector('section.view'))
    expect(container.querySelector('.view .ambient-bg')).toBeNull()
  })

  it.each([
    ['HistoryView', <HistoryView />],
    ['AnalyzingView', <AnalyzingView id="j1" />],
  ])('is not rendered by %s', (_name, view) => {
    const { container } = render(view)
    expect(container.querySelector('.ambient-bg')).toBeNull()
  })
})
