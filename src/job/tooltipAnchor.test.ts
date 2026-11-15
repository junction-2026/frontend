import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/job/results.css', 'utf8')
const rule = (sel: string) => new RegExp(`(?:^|\\n)${sel.replace(/[+.\s]/g, (c) => (c === ' ' ? '\\s+' : '\\' + c))}\\s*{([^}]*)}`).exec(css)?.[1] ?? ''

describe('info tooltip anchors', () => {
  it('anchors the verdict tooltips to .verdict-head, not to their buttons', () => {
    expect(rule('.verdict-head')).toMatch(/position:\s*relative/)
    expect(rule('.verdict-head .confidence-info')).toMatch(/position:\s*static/)
    expect(rule('.confidence-tip')).toMatch(/position:\s*absolute/)
    expect(rule('.confidence-tip')).toMatch(/inset-inline-end:\s*0/)
  })
  it('keeps the risk info tooltip anchored to its own button', () => {
    expect(rule('.confidence-info')).toMatch(/position:\s*relative/)
  })
})
