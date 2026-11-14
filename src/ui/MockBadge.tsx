import type { ReactNode } from 'react'

// Marks UI that is not connected to the backend. Never wrap real data in it; list the area in docs/mock-areas.md.
export function Mock({ label, block, children }: { label?: string; block?: boolean; children: ReactNode }) {
  const title = `Mock data – not connected to the backend${label ? ` (${label})` : ''}`
  return (
    <span className={block ? 'mock mock-block' : 'mock'} data-mock="true" title={title} aria-label={title}>
      <span className="mock-badge" aria-hidden="true">MOCK</span>
      {children}
    </span>
  )
}

export default Mock
