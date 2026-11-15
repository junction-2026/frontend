import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ExploreView from './ExploreView'

beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ExploreView solid background', () => {
  for (const [name, id] of [['global map', undefined], ['job coverage', 'job-1']] as const) {
    it(`renders no backdrop layer for the ${name}`, () => {
      const { container } = render(<ExploreView id={id} />)
      expect(container.children).toHaveLength(1) // no sibling backdrop layer before or after the page
      expect(container.firstElementChild).toBe(container.querySelector('section.view'))
      expect(container.querySelector('.ambient-bg')).toBeNull()
      expect(container.querySelector('canvas')).toBeNull()
    })
  }
})
