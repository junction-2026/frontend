import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ExploreView from './ExploreView'
import HomeView from './HomeView'

beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ExploreView veil', () => {
  for (const [name, id] of [['global map', undefined], ['job coverage', 'job-1']] as const) {
    it(`renders one veil directly before .view for the ${name}`, () => {
      const { container } = render(<ExploreView id={id} />)
      expect(container.querySelectorAll('.explore-veil')).toHaveLength(1)
      const view = container.querySelector('section.view')
      expect(view).not.toBeNull()
      expect(container.querySelector('.explore-veil')!.nextElementSibling).toBe(view)
      expect(container.querySelector('.view .explore-veil')).toBeNull()
    })
  }

  it('is not rendered by HomeView', () => {
    const { container } = render(<HomeView />)
    expect(container.querySelector('.explore-veil')).toBeNull()
  })
})
