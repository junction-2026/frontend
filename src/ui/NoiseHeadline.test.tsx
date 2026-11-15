import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HistoryView from '../views/HistoryView'
import AnalyzingView from '../views/AnalyzingView'
import HomeView from '../views/HomeView'
import { NoiseHeadline } from './NoiseHeadline'

describe('NoiseHeadline', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
    window.history.replaceState(null, '', '/')
  })
  afterEach(() => vi.unstubAllGlobals())

  it('is one hidden ltr root with the exact phrase and nothing focusable', () => {
    const { container } = render(<NoiseHeadline />)
    const roots = container.querySelectorAll('.noise-headline')
    expect(roots).toHaveLength(1)
    expect(roots[0]).toHaveAttribute('aria-hidden', 'true')
    expect(roots[0]).toHaveAttribute('dir', 'ltr')
    const text = roots[0].querySelectorAll('.noise-headline-text')
    expect(text).toHaveLength(1)
    expect(text[0].textContent).toBe('Decode the Noise')
    expect(text[0]).toHaveAttribute('data-text', 'Decode the Noise')
    expect(roots[0].textContent).toBe('Decode the Noise')
    expect(roots[0].querySelector('a, button, input, [tabindex]')).toBeNull()
  })

  it('HomeView mounts it right before .ambient-bg, which still precedes section.view', () => {
    const { container } = render(<HomeView />)
    expect(container.querySelectorAll('.noise-headline')).toHaveLength(1)
    const ambient = container.querySelector('.ambient-bg')!
    expect(container.querySelector('.noise-headline')!.nextElementSibling).toBe(ambient)
    expect(ambient.nextElementSibling).toBe(container.querySelector('section.view'))
  })

  it.each([
    ['HistoryView', <HistoryView />],
    ['AnalyzingView', <AnalyzingView id="j1" />],
  ])('is not rendered by %s', (_name, view) => {
    const { container } = render(view)
    expect(container.querySelector('.noise-headline')).toBeNull()
  })
})
