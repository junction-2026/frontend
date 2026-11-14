import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '../i18n/translate'
import { enumLabel, percent } from './text'

describe('enumLabel', () => {
  const t = (key: string) => translate('de', key)
  it('maps a known value to the catalog and shows an unknown one raw', () => {
    expect(enumLabel(t, 'analysis.job_status', 'running')).toBe('läuft')
    expect(enumLabel(t, 'analysis.job_status', 'brand_new')).toBe('brand_new')
    expect(enumLabel(t, 'analysis.job_status', undefined)).toBe('')
  })
})

describe('percent', () => {
  it('rounds to a whole percent in the given locale', () => {
    const fmt = (l: 'en' | 'fr') => (v: number, o?: Intl.NumberFormatOptions) => new Intl.NumberFormat(l, o).format(v)
    expect(percent(fmt('en'), 0.864)).toBe('86%')
    expect(percent(fmt('fr'), 0.864)).toMatch(/^86\s%$/) // \s covers U+00A0 and U+202F
  })
})

describe('RTL stylesheets', () => {
  it.each(['job.css', 'results.css'])('%s has no physical left/right properties', (file) => {
    const css = readFileSync(new URL(file, import.meta.url), 'utf8')
    expect(css).not.toMatch(/(^|[\s;{])(left|right|margin-left|margin-right|padding-left|padding-right|border-left|border-right)\s*:/m)
    expect(css).not.toMatch(/text-align:\s*(left|right)/)
  })
})
