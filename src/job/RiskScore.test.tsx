import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '../i18n'
import { CATALOGS } from '../i18n/translate'
import { job, risk } from './fixtures'
import { RiskScore } from './RiskScore'
import type { Job } from '../api/types'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const show = (r: unknown, lng = 'en') => {
  localStorage.setItem('veil.locale', lng)
  return render(<I18nProvider><RiskScore job={job({ risk: r }) as unknown as Job} /></I18nProvider>)
}
const section = () => document.querySelector('.risk') as HTMLElement
const chip = () => section().querySelector('.risk-chip') as HTMLElement
const unavailable = (extra: Record<string, unknown> = {}) =>
  risk({ status: 'unavailable', reason: 'no_content_signals', score: null, raw_score: null, band: null, drivers: [], techniques: [], ...extra,
    dimensions: { intensity: { available: false, score: null, reason: 'analyzer_unavailable' }, confirmation: { available: false, score: null, reason: 'analyzer_unavailable' }, amplification: { available: false, score: null, reason: 'no_author_context' } } })

describe('RiskScore: scored', () => {
  it('shows percent, band chip, summary, info button, three bars, techniques, drivers and caveats', () => {
    show(risk())
    expect(screen.getByRole('heading', { level: 2, name: 'Manipulation Risk Score' })).toBeInTheDocument()
    expect(section().querySelector('.risk-score')).toHaveTextContent('68%')
    expect(chip()).toHaveTextContent('High risk')
    expect(chip().dataset.band).toBe('high')
    expect(section().querySelector('.risk-summary')).toHaveTextContent('Clear signs of manipulation were found. Main signal: signs of artificial amplification.')
    expect(screen.getByRole('button', { name: 'What does the risk score mean?' })).toBeInTheDocument()
    const meters = screen.getAllByRole('meter')
    expect(meters.map((m) => [m.getAttribute('aria-label'), m.getAttribute('aria-valuenow')])).toEqual([['Intensity', '42'], ['Confirmation', '80'], ['Amplification', '90']])
    const rows = section().querySelectorAll('.risk-techniques li')
    expect([...rows].map((r) => r.textContent)).toEqual(['Appeal to fear90%High impact', 'Loaded language70%High impact', 'Doubt35%Lower impact'])
    expect(screen.getByText('The source shows signs of artificial amplification.')).toBeInTheDocument()
    expect(screen.getByText('The writing follows patterns typical of propaganda.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Caveats/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('This rating describes the content, not whether a reader will be manipulated.')).toBeInTheDocument()
  })

  it.each([['low', 'low'], ['moderate', 'moderate'], ['high', 'high'], ['critical', 'critical']])('styles band %s', (band, v) => {
    show(risk({ band }))
    expect(chip().dataset.band).toBe(v)
  })

  it('names a technique driver with the technique name', () => {
    show(risk({ drivers: [{ kind: 'technique', dimension: 'intensity', technique: 'Loaded_Language', contribution: 0.2, text: 'srv' }] }))
    expect(screen.getByText('Manipulative technique in the text: Loaded language.')).toBeInTheDocument()
    expect(section().querySelector('.risk-summary')).toHaveTextContent('Main signal: Loaded language.')
  })

  it('shows the no-signal sentence for kind none', () => {
    show(risk({ score: 0.02, band: 'low', drivers: [{ kind: 'none', dimension: null, technique: null, contribution: 0, text: 'x' }] }))
    expect(screen.getAllByText('No clear signs of manipulation were found.').length).toBeGreaterThan(0)
    expect(section().querySelector('.risk-summary')).toHaveTextContent('Few signs of manipulation were found. No single signal stands out.')
  })

  it('translates technique names and texts outside English', () => {
    show(risk(), 'de')
    expect(chip()).toHaveTextContent('Hohes Risiko')
    expect(section().querySelectorAll('.risk-techniques li')[1]).toHaveTextContent(CATALOGS.de['techniques.Loaded_Language.name'])
  })
})

describe('RiskScore: degraded', () => {
  it('scored without amplification: two bars and a note', () => {
    show(risk({ dimensions: { ...risk().dimensions, amplification: { available: false, score: null, weight: 0, contribution: 0, confidence: null, reason: 'no_author_context', basis: null } } }))
    expect(screen.getAllByRole('meter')).toHaveLength(2)
    expect(section()).toHaveTextContent('Amplification: no author information was available.')
  })

  it.each([['analyzer_unavailable', 'this check was not available'], ['no_bot_score', 'no usable signal'], ['something_new', 'the input was not available']])('explains amplification reason %s', (reason, text) => {
    show(risk({ dimensions: { ...risk().dimensions, amplification: { available: false, score: null, reason } } }))
    expect(section().querySelector('.risk-note')).toHaveTextContent(text)
  })

  it('explains unavailable intensity and shows no technique rows', () => {
    show(risk({ dimensions: { ...risk().dimensions, intensity: { available: false, score: null, reason: 'analyzer_unavailable' } }, techniques: [] }))
    expect(section()).toHaveTextContent('Intensity: this check was not available for this job.')
    expect(section()).not.toHaveTextContent('No manipulative techniques were detected.')
    expect(section()).not.toHaveTextContent('Detected techniques')
  })

  it('says none were detected only when intensity is available', () => {
    show(risk({ techniques: [] }))
    expect(section()).toHaveTextContent('No manipulative techniques were detected.')
  })

  it('marks a single_text amplification as low confidence', () => {
    show(risk({ dimensions: { ...risk().dimensions, amplification: { available: true, score: 0.6, confidence: 'low', basis: 'single_text' } } }))
    expect(screen.getAllByText('Low confidence')).toHaveLength(1)
  })

  it('dampened score is still shown with its caveat', () => {
    show(risk({ score: 0.1669, raw_score: 0.2782, band: 'low', dampened: true, caveats: [{ id: 'content_not_reader', text: 'a' }, { id: 'weak_signal', text: 'b' }] }))
    expect(section().querySelector('.risk-score')).toHaveTextContent('17%')
    expect(chip()).toHaveTextContent('Low risk')
    expect(screen.getByText('The propaganda-pattern signal was weak, so the overall rating was lowered.')).toBeInTheDocument()
  })

  it('unavailable: no percentage or band, reason explained, caveats and info button kept', () => {
    show(unavailable({ caveats: [{ id: 'content_not_reader', text: 'a' }] }))
    expect(section().querySelector('.risk-score')).toBeNull()
    expect(chip()).toBeNull()
    expect(section()).toHaveTextContent('No risk score could be given. There were not enough signals in the content to rate it.')
    expect(screen.getByRole('button', { name: 'What does the risk score mean?' })).toBeInTheDocument()
    expect(screen.getByText('This rating describes the content, not whether a reader will be manipulated.')).toBeInTheDocument()
    expect(section()).not.toHaveTextContent('No manipulative techniques were detected.')
  })

  it.each([
    ['unknown status', { status: 'weird' }],
    ['scored without a band', { band: null }],
    ['scored without a score', { score: null }],
    ['scored without drivers', { drivers: [] }],
  ])('%s is shown as unavailable', (_n, extra) => {
    show(risk(extra))
    expect(section().querySelector('.risk-score')).toBeNull()
    expect(chip()).toBeNull()
    expect(section()).toHaveTextContent('The rating was not available for this job.')
  })

  it.each([['null', null], ['undefined', undefined], ['a string', 'x']])('risk %s renders nothing', (_n, r) => {
    const { container } = show(r)
    expect(container).toBeEmptyDOMElement()
  })

  it('survives a risk with missing members', () => {
    show({ status: 'scored', score: 0.5, band: 'high', drivers: [{ kind: 'amplification' }], dimensions: null, techniques: 'x', caveats: null })
    expect(section().querySelector('.risk-score')).toHaveTextContent('50%')
    expect(screen.queryAllByRole('meter')).toHaveLength(0)
    expect(screen.getByText('This rating describes the content, not whether a reader will be manipulated.')).toBeInTheDocument()
  })
})

describe('RiskScore: unknown ids and plain text', () => {
  it('unknown band: moderate colours, the id and the server summary', () => {
    show(risk({ band: 'extreme' }))
    expect(chip()).toHaveTextContent('extreme')
    expect(chip().dataset.band).toBe('moderate')
    expect(section().querySelector('.risk-summary')).toHaveTextContent('Server summary: high risk.')
  })

  it('unknown driver kind and caveat id use the server text, as plain text', () => {
    show(risk({ drivers: [{ kind: 'novel', technique: null, text: '<b>driver</b>' }], caveats: [{ id: 'content_not_reader', text: 'x' }, { id: 'novel', text: '<b>caveat</b>' }] }))
    expect(screen.getByText('<b>driver</b>')).toBeInTheDocument()
    expect(screen.getByText('<b>caveat</b>')).toBeInTheDocument()
    expect(section().querySelector('b')).toBeNull()
    expect(section().querySelector('.risk-summary')).toHaveTextContent('Server summary')
  })

  it('shows an unknown impact group by its id and a server technique name', () => {
    show(risk({ techniques: [{ label: 'New_Tech', display: '<i>New</i>', probability: 0.5, impact: 'extra' }] }))
    expect(section().querySelector('.risk-techniques li')).toHaveTextContent('<i>New</i>50%extra')
  })

  it('always lists content_not_reader, also when the server omits it', () => {
    show(risk({ caveats: [{ id: 'bot_not_intent', text: 'x' }] }))
    const items = section().querySelectorAll('.risk-block [role=region] li')
    expect(items[0]).toHaveTextContent('describes the content')
    expect(items).toHaveLength(2)
    expect(section().querySelector('ul[role]')).toBeNull()
  })
})

describe('RiskScore: interaction', () => {
  it('opens the tooltip on focus, describes the button, closes on Escape and blur', () => {
    show(risk())
    const btn = screen.getByRole('button', { name: 'What does the risk score mean?' })
    expect(screen.queryByRole('tooltip')).toBeNull()
    fireEvent.focus(btn)
    const tip = screen.getByRole('tooltip')
    expect(btn).toHaveAttribute('aria-describedby', tip.id)
    expect(tip).toHaveTextContent('manipulative techniques, propaganda-like writing patterns and signs of artificial amplification')
    expect(tip).toHaveTextContent('not how readers will react')
    fireEvent.keyDown(btn, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).toBeNull()
    fireEvent.click(btn)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.blur(btn)
    expect(screen.queryByRole('tooltip')).toBeNull()
    fireEvent.mouseEnter(btn)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.mouseLeave(btn)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('collapses and expands the caveats', () => {
    show(risk())
    const btn = screen.getByRole('button', { name: /Caveats/ })
    expect(within(section()).getByRole('region', { name: 'Caveats' })).toBeInTheDocument()
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('region', { name: 'Caveats' })).toBeNull()
    expect(screen.queryByText(/describes the content/)).toBeNull()
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/describes the content/)).toBeInTheDocument()
  })
})

describe('risk texts in every locale', () => {
  const keys = Object.keys(CATALOGS.en).filter((k) => k.startsWith('results.risk.'))
  const banned: Record<string, RegExp> = {
    en: /model|algorithm|classifier|probabilit/i,
    fr: /mod[eè]le|algorithme|classifieur|probabilit/i,
    de: /modell|algorithmus|klassifikator|klassifizierer|wahrscheinlichkeit/i,
    fi: /malli|mallin|algoritm|luokittel|todennäköisyy/i,
    ru: /модел|алгоритм|классификатор|вероятност/i,
    ar: /نموذج|خوارزم|مصنف|احتمال/,
  }
  it('has the risk keys', () => expect(keys.length).toBeGreaterThan(40))
  it.each(Object.keys(banned))('%s: no model, algorithm, classifier or probability wording and no digit in any risk text', (lng) => {
    for (const k of keys) {
      const v = CATALOGS[lng][k]
      expect(v, `${lng} ${k}`).not.toMatch(banned[lng])
      expect(v, `${lng} ${k}`).not.toMatch(/\d/)
    }
  })
  it.each(Object.keys(banned))('%s: the tooltip names the three observations and is not empty', (lng) => {
    localStorage.setItem('veil.locale', lng)
    show(risk(), lng)
    fireEvent.focus(document.querySelector('.info-btn') as HTMLElement)
    expect(screen.getByRole('tooltip').textContent!.length).toBeGreaterThan(80)
    expect(screen.getByRole('tooltip').textContent).toBe(CATALOGS[lng]['results.risk.info_tip'])
  })
  it('renders in Arabic (right-to-left) without catalog fallbacks', () => {
    show(risk(), 'ar')
    expect(chip()).toHaveTextContent(CATALOGS.ar['results.risk.band.high'])
    expect(section().textContent).not.toContain('…')
  })
})

describe('risk styling', () => {
  const css = readFileSync('src/styles/tokens.css', 'utf8')
  const token = (n: string) => new RegExp(`--${n}:\\s*(#[0-9a-f]{6})`, 'i').exec(css)![1]
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const lum = (h: string) => { const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(h.slice(i, i + 2), 16) / 255)); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
  const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
  it.each(['low', 'moderate', 'high', 'critical'])('%s chip text reaches 4.5:1', (band) => {
    expect(contrast(token(`risk-${band}-text`), token(`risk-${band}-bg`))).toBeGreaterThanOrEqual(4.5)
  })
  it('uses logical properties only', () => {
    expect(readFileSync('src/job/riskScore.css', 'utf8')).not.toMatch(/(margin|padding|border)-(left|right)|(^|[\s{;])(left|right)\s*:|text-align:\s*(left|right)|[^-]width:|[^-]height:/m)
  })
})
