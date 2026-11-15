import { describe, expect, it, vi } from 'vitest'
import { GL_ATTRIBUTES, getGl, isLowPower, prefersReducedMotion } from './capability'

describe('isLowPower', () => {
  it('is false for a capable or unreported device', () => {
    expect(isLowPower({})).toBe(false)
    expect(isLowPower({ hardwareConcurrency: 8, deviceMemory: 8, connection: { saveData: false } })).toBe(false)
  })
  it('holds for few cores, little memory or save-data', () => {
    expect(isLowPower({ hardwareConcurrency: 2 })).toBe(true)
    expect(isLowPower({ hardwareConcurrency: 4, deviceMemory: 2 })).toBe(true)
    expect(isLowPower({ hardwareConcurrency: 8, connection: { saveData: true } })).toBe(true)
  })
})

describe('prefersReducedMotion', () => {
  it('reads the media query', () => {
    const mm = vi.fn((q: string) => ({ matches: q === '(prefers-reduced-motion: reduce)' }))
    expect(prefersReducedMotion({ matchMedia: mm } as unknown as Window)).toBe(true)
    expect(prefersReducedMotion({ matchMedia: () => ({ matches: false }) } as unknown as Window)).toBe(false)
    expect(prefersReducedMotion({} as Window)).toBe(false)
  })
})

describe('getGl', () => {
  it('requests webgl1 with the low-power attributes', () => {
    const gl = {}
    const getContext = vi.fn(() => gl)
    expect(getGl({ getContext } as unknown as HTMLCanvasElement)).toBe(gl)
    expect(getContext).toHaveBeenCalledWith('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' })
    expect(GL_ATTRIBUTES.antialias).toBe(false)
  })
  it('returns null when creation fails or throws', () => {
    expect(getGl({ getContext: () => null } as unknown as HTMLCanvasElement)).toBeNull()
    expect(getGl({ getContext: () => { throw new Error('no gl') } } as unknown as HTMLCanvasElement)).toBeNull()
  })
})
