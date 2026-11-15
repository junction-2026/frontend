import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ArchiveBackground } from './ArchiveBackground'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  delete (document as unknown as Record<string, unknown>).visibilityState
})

const isLightWarm = (h: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  return /^#[0-9a-f]{6}$/i.test(h) && Math.min(r, g, b) >= 0xc8 && r >= g && g >= b && r - b <= 0x18
}

const setVisibility = (state: 'hidden' | 'visible') => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  act(() => void document.dispatchEvent(new Event('visibilitychange')))
}

describe('ArchiveBackground', () => {
  it('renders one hidden layer: room then scrim; no text, nothing focusable, no removed layers', () => {
    const { container } = render(<ArchiveBackground />)
    const bg = container.querySelectorAll('.archive-bg')
    expect(bg).toHaveLength(1)
    expect(bg[0]).toHaveAttribute('aria-hidden', 'true')
    expect([...bg[0].children].map((c) => c.className)).toEqual(['archive-room', 'archive-scrim'])
    expect(bg[0].textContent).toBe('')
    expect(bg[0].querySelector('[tabindex],a,button,input,select,textarea')).toBeNull()
    for (const gone of ['light', 'shaft', 'dust', 'mote', 'vignette', 'shelves-far', 'shelves-near']) expect(container.querySelector(`.archive-${gone}`)).toBeNull()
  })

  it('draws one hidden SVG bookshelf: 3-5 rows, at most 80 shapes, a leaning book, light warm fills', () => {
    const { container } = render(<ArchiveBackground />)
    const svgs = container.querySelectorAll('.archive-room > svg')
    expect(svgs).toHaveLength(1)
    const svg = svgs[0]
    expect(svg).toHaveClass('archive-shelves')
    expect(svg.getAttribute('focusable')).toBe('false')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid slice')
    const rows = svg.querySelectorAll('.archive-row').length
    expect(rows).toBeGreaterThanOrEqual(3)
    expect(rows).toBeLessThanOrEqual(5)
    const shapes = svg.querySelectorAll('rect,line,path')
    expect(shapes.length).toBeLessThanOrEqual(80)
    expect(svg.querySelectorAll('*').length).toBe(shapes.length + rows)
    expect(svg.querySelectorAll('[transform^="rotate"]').length).toBeGreaterThan(0)
    expect(new Set([...svg.querySelectorAll('.archive-row rect[rx]')].map((r) => r.getAttribute('height'))).size).toBeGreaterThan(5)
    for (const r of svg.querySelectorAll('[rx]')) expect(+r.getAttribute('rx')!).toBeLessThanOrEqual(2)
    const colours = [...svg.querySelectorAll('[fill],[stroke]')].flatMap((e) => [e.getAttribute('fill'), e.getAttribute('stroke')]).filter((c): c is string => !!c && c !== 'none')
    expect(colours.length).toBeGreaterThan(0)
    for (const c of colours) expect(isLightWarm(c)).toBe(true)
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
