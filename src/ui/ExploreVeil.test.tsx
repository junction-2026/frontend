import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExploreVeil } from './ExploreVeil'

type Listener = () => void
let reduced: boolean
let listeners: Listener[]
let getContext: ReturnType<typeof vi.fn>
let loseContext: ReturnType<typeof vi.fn>
let hardware: ReturnType<typeof vi.spyOn>

function glMock() {
  return new Proxy(
    { getExtension: (n: string) => (n === 'WEBGL_lose_context' ? { loseContext } : null), getShaderParameter: () => true, getProgramParameter: () => true },
    { get: (t, k: string) => (k in t ? t[k as keyof typeof t] : /^[A-Z_]+$/.test(k) ? 1 : () => ({})) },
  )
}

beforeEach(() => {
  reduced = false
  listeners = []
  loseContext = vi.fn()
  hardware = vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(8)
  vi.stubGlobal('matchMedia', (q: string) => ({
    get matches() { return reduced && q.includes('reduce') },
    addEventListener: (_: string, l: Listener) => listeners.push(l),
    removeEventListener: (_: string, l: Listener) => (listeners = listeners.filter((x) => x !== l)),
  }))
  vi.stubGlobal('requestAnimationFrame', () => 1)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  getContext = vi.fn(() => glMock())
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(getContext as never)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'deviceMemory')
})

const mount = () => render(<ExploreVeil />).container

describe('ExploreVeil', () => {
  it('WebGL mode: one hidden layer holding one canvas, no fallback, no text, nothing focusable', () => {
    const c = mount()
    const layers = c.querySelectorAll('.explore-veil')
    expect(layers).toHaveLength(1)
    expect(layers[0]).toHaveAttribute('aria-hidden', 'true')
    expect([...layers[0].children].map((e) => e.tagName)).toEqual(['CANVAS'])
    expect(c.querySelector('canvas')).toHaveClass('explore-veil-canvas')
    expect(c.querySelector('.explore-veil-fallback')).toBeNull()
    expect(c.textContent).toBe('')
    expect(c.querySelector('a, button, input, textarea, select, [tabindex], [contenteditable]')).toBeNull()
    expect(c.querySelector('.explore-veil-truth, .explore-veil-panel')).toBeNull()
  })

  it('falls back (no canvas) when the context cannot be created, or throws', async () => {
    for (const impl of [() => null, () => { throw new Error('no gl') }]) {
      getContext.mockImplementation(impl)
      const { container } = render(<ExploreVeil />)
      await act(async () => {})
      expect(container.querySelector('canvas')).toBeNull()
      expect(container.querySelectorAll('.explore-veil > .explore-veil-fallback')).toHaveLength(1)
      expect(container.querySelector('.explore-veil')).toHaveAttribute('aria-hidden', 'true')
      cleanup()
    }
  })

  it('falls back without asking for a context under reduced motion, and follows later changes', () => {
    reduced = true
    const c = mount()
    expect(c.querySelector('canvas')).toBeNull()
    expect(c.querySelector('.explore-veil-fallback')).not.toBeNull()
    expect(getContext).not.toHaveBeenCalled()
    reduced = false
    act(() => listeners.forEach((l) => l()))
    expect(c.querySelector('canvas')).not.toBeNull()
    expect(c.querySelector('.explore-veil-fallback')).toBeNull()
    reduced = true
    act(() => listeners.forEach((l) => l()))
    expect(c.querySelector('canvas')).toBeNull()
    expect(loseContext).toHaveBeenCalled()
  })

  it('falls back on a low-power device (few cores, little memory, save-data)', () => {
    for (const setup of [() => hardware.mockReturnValue(2), () => Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true })]) {
      hardware.mockReturnValue(8)
      setup()
      const c = mount()
      expect(c.querySelector('canvas')).toBeNull()
      expect(c.querySelector('.explore-veil-fallback')).not.toBeNull()
      cleanup()
    }
    expect(getContext).not.toHaveBeenCalled()
  })

  it('switches to the fallback when the GL context is lost', () => {
    const c = mount()
    act(() => {
      c.querySelector('canvas')!.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    })
    expect(c.querySelector('canvas')).toBeNull()
    expect(c.querySelector('.explore-veil-fallback')).not.toBeNull()
  })

  it('on unmount cancels the frame, removes listeners and loses the context', () => {
    const cancel = vi.fn()
    vi.stubGlobal('cancelAnimationFrame', cancel)
    const off = vi.spyOn(document, 'removeEventListener')
    const { unmount } = render(<ExploreVeil />)
    unmount()
    expect(cancel).toHaveBeenCalled()
    expect(off).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(loseContext).toHaveBeenCalledOnce()
    expect(listeners).toHaveLength(0)
  })
})
