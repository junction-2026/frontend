import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExploreVeil } from './ExploreVeil'

describe('ExploreVeil', () => {
  it('is one hidden container: the truth glow, then 2-3 panels, with no text', () => {
    const { container } = render(<ExploreVeil />)
    const layers = container.querySelectorAll('.explore-veil')
    expect(layers).toHaveLength(1)
    expect(layers[0]).toHaveAttribute('aria-hidden', 'true')
    const kids = [...layers[0].children]
    expect(kids[0]).toHaveClass('explore-veil-truth')
    const panels = kids.slice(1)
    expect(panels.length).toBeGreaterThanOrEqual(2)
    expect(panels.length).toBeLessThanOrEqual(3)
    for (const p of panels) expect(p).toHaveClass('explore-veil-panel')
    expect(container.querySelectorAll('.explore-veil-truth')).toHaveLength(1)
    expect(container.textContent).toBe('')
  })

  it('has no focusable or tabindex descendants', () => {
    const { container } = render(<ExploreVeil />)
    expect(container.querySelector('a, button, input, textarea, select, [tabindex], [contenteditable]')).toBeNull()
  })
})
