import '@testing-library/jest-dom/vitest'

// jsdom does not implement scrolling.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

// jsdom has no canvas: report "no context" (the veil then shows its fallback) instead of logging "not implemented".
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
