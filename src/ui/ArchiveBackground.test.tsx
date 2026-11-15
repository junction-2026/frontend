import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ArchiveBackground } from './ArchiveBackground'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  delete (document as unknown as Record<string, unknown>).visibilityState
})

const setVisibility = (state: 'hidden' | 'visible') => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  act(() => void document.dispatchEvent(new Event('visibilitychange')))
}

describe('ArchiveBackground', () => {
  it('renders one hidden layer: room, light, dust, vignette, scrim; no text, nothing focusable', () => {
    const { container } = render(<ArchiveBackground />)
    const bg = container.querySelectorAll('.archive-bg')
    expect(bg).toHaveLength(1)
    expect(bg[0]).toHaveAttribute('aria-hidden', 'true')
    expect([...bg[0].children].map((c) => c.className)).toEqual(['archive-room', 'archive-light', 'archive-dust', 'archive-vignette', 'archive-scrim'])
    expect(bg[0].textContent).toBe('')
    expect(bg[0].querySelector('[tabindex],a,button,input,select,textarea')).toBeNull()
    expect(container.querySelectorAll('.archive-light > .archive-shaft').length).toBeGreaterThanOrEqual(2)
    expect(container.querySelectorAll('.archive-light > .archive-shaft').length).toBeLessThanOrEqual(3)
    const motes = container.querySelectorAll('.archive-dust > .archive-mote').length
    expect(motes).toBeGreaterThanOrEqual(16)
    expect(motes).toBeLessThanOrEqual(24)
  })

  it('draws two hidden SVG shelf layers with at least 4 rows of every document shape', () => {
    const { container } = render(<ArchiveBackground />)
    expect([...container.querySelector('.archive-room')!.children].map((c) => c.getAttribute('class'))).toEqual(['archive-shelves-far', 'archive-shelves-near'])
    for (const svg of container.querySelectorAll('.archive-room > svg')) {
      expect(svg.getAttribute('focusable')).toBe('false')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg.querySelectorAll('.archive-row').length).toBeGreaterThanOrEqual(4)
      for (const kind of ['scroll', 'roll', 'folder', 'manuscript', 'stack']) expect(svg.querySelectorAll(`.archive-${kind}`).length).toBeGreaterThan(0)
    }
    expect(container.querySelectorAll('svg:not([focusable="false"])')).toHaveLength(0)
  })

  it('toggles archive-paused with the tab visibility and removes its listener on unmount', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const { container, unmount } = render(<ArchiveBackground />)
    const bg = container.querySelector('.archive-bg')!
    expect(bg).not.toHaveClass('archive-paused')
    setVisibility('hidden')
    expect(bg).toHaveClass('archive-paused')
    setVisibility('visible')
    expect(bg).not.toHaveClass('archive-paused')
    const handler = add.mock.calls.find((c) => c[0] === 'visibilitychange')![1]
    unmount()
    expect(remove).toHaveBeenCalledWith('visibilitychange', handler)
  })

  it('starts paused when mounted in a hidden tab', () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    const { container } = render(<ArchiveBackground />)
    expect(container.querySelector('.archive-bg')).toHaveClass('archive-paused')
  })
})
