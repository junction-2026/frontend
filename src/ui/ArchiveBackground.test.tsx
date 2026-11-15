import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ArchiveBackground } from './ArchiveBackground'

afterEach(cleanup)

describe('ArchiveBackground', () => {
  it('renders one hidden layer: 5-8 docs then the veil, no text, nothing focusable', () => {
    const { container } = render(<ArchiveBackground />)
    const bg = container.querySelectorAll('.archive-bg')
    expect(bg).toHaveLength(1)
    expect(bg[0]).toHaveAttribute('aria-hidden', 'true')
    expect([...bg[0].children].map((c) => c.className)).toEqual(['archive-docs', 'archive-veil'])
    const docs = container.querySelectorAll('.archive-docs > .archive-doc')
    expect(docs.length).toBeGreaterThanOrEqual(5)
    expect(docs.length).toBeLessThanOrEqual(8)
    expect(bg[0].textContent).toBe('')
    expect(bg[0].querySelector('[tabindex],a,button,input,select,textarea,svg:not([focusable="false"])')).toBeNull()
  })
})
