import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/job/results.css', 'utf8')
const rule = (sel: string) => css.match(new RegExp(`^${sel.replace('.', '\\.')} \\{([^}]*)\\}`, 'm'))?.[1] ?? ''

describe('verdict tooltip anchor', () => {
  it('anchors the confidence and origin tooltips to .verdict-head, not to their buttons', () => {
    expect(rule('.verdict-head')).toMatch(/position:\s*relative/)
    expect(rule('.confidence-info')).not.toMatch(/position:/)
    expect(rule('.confidence-tip')).toMatch(/position:\s*absolute/)
    expect(rule('.confidence-tip')).toMatch(/inset-inline-end:\s*0/)
  })
})
