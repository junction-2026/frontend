import { render, screen } from '@testing-library/react'
import { Mock } from './MockBadge'

describe('Mock', () => {
  it('wraps children with a visible MOCK badge, tooltip and aria-label', () => {
    render(<Mock label="Language"><button>English ▾</button></Mock>)
    const wrapper = screen.getByRole('button', { name: 'English ▾' }).closest('[data-mock="true"]')!
    expect(wrapper).toHaveAttribute('title', 'Mock data – not connected to the backend (Language)')
    expect(wrapper.getAttribute('aria-label')).toMatch(/mock/i)
    expect(wrapper).toHaveClass('mock')
    expect(wrapper).toHaveTextContent('MOCK')
  })

  it('has the plain tooltip without a label', () => {
    render(<Mock>x</Mock>)
    expect(screen.getByText('x').closest('[data-mock]')).toHaveAttribute('title', 'Mock data – not connected to the backend')
  })
})
