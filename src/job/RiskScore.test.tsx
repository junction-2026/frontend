import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '../i18n'
import { CATALOGS } from '../i18n/translate'
import { job, risk } from './fixtures'
import { RiskMetric, RiskScore } from './RiskScore'
import type { Job } from '../api/types'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const show = (r: unknown, lng = 'en') => {
  localStorage.setItem('veil.locale', lng)
  return render(<I18nProvider><RiskScore job={job({ risk: r }) as unknown as Job} /></I18nProvider>)
}
const showMetric = (r: unknown, lng = 'en') => {
  localStorage.setItem('veil.locale', lng)
  return render(<I18nProvider><RiskMetric job={job({ risk: r }) as unknown as Job} /></I18nProvider>)
}
const section = () => document.querySelector('.risk') as HTMLElement
const chip = () => document.querySelector('.risk-chip') as HTMLElement
const openDrivers = () => fireEvent.click(screen.getByRole('button', { name: /Main drivers/ }))
const openCaveats = () => fireEvent.click(screen.getByRole('button', { name: /Caveats/ }))
const unavailable = (extra: Record<string, unknown> = {}) =>
  risk({ status: 'unavailable', reason: 'no_content_signals', score: null, raw_score: null, band: null, drivers: [], techniques: [], ...extra,
    dimensions: { intensity: { available: false, score: null, reason: 'analyzer_unavailable' }, confirmation: { available: false, score: null, reason: 'analyzer_unavailable' }, amplification: { available: false, score: null, reason: 'no_author_context' } } })

describe('RiskScore: scored', () => {
  it('shows summary, info button, three bars, techniques, drivers and caveats', () => {
    show(risk())
    expect(screen.getByRole('heading', { level: 3, name: 'Manipulation Risk Score' })).toBeInTheDocument()
    expect(section().querySelector('.risk-score, .risk-chip')).toBeNull() // headline lives in the metrics bar
    expect(section().querySelector('.risk-summary')).toHaveTextContent('Clear signs of manipulation were found. Main signal: signs of artificial amplification.')
    expect(screen.getByRole('button', { name: 'What does the risk score mean?' })).toBeInTheDocument()
    const meters = screen.getAllByRole('meter')
    expect(meters.map((m) => [m.getAttribute('aria-label'), m.getAttribute('aria-valuenow')])).toEqual([['Intensity', '42'], ['Confirmation', '80'], ['Amplification', '90']])
    const rows = section().querySelectorAll('.risk-techniques li')
    expect([...rows].map((r) => r.textContent)).toEqual(['Appeal to fear90%High impact', 'Loaded language70%High impact', 'Doubt35%Lower impact'])
    expect(screen.getByRole('button', { name: 'Main drivers (2)' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('The source shows signs of artificial amplification.')).toBeNull()
    expect(screen.getByRole('button', { name: /Caveats/ })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('This rating describes the content, not whether a reader will be manipulated.')).toBeNull()
  })

  it.each([['low', 'low'], ['moderate', 'moderate'], ['high', 'high'], ['critical', 'critical']])('styles band %s', (band, v) => {
    showMetric(risk({ band }))
    expect(chip().dataset.band).toBe(v)
    expect(chip()).toHaveTextContent(`${band[0].toUpperCase()}${band.slice(1)} risk`)
  })

  it('names a technique driver with the technique name', () => {
    show(risk({ drivers: [{ kind: 'technique', dimension: 'intensity', technique: 'Loaded_Language', contribution: 0.2, text: 'srv' }] }))
    openDrivers()
    expect(screen.getByText('Manipulative technique in the text: Loaded language.')).toBeInTheDocument()
    expect(section().querySelector('.risk-summary')).toHaveTextContent('Main signal: Loaded language.')
  })

  it('shows the no-signal sentence for kind none', () => {
    show(risk({ score: 0.02, band: 'low', drivers: [{ kind: 'none', dimension: null, technique: null, contribution: 0, text: 'x' }] }))
    openDrivers()
    expect(screen.getAllByText('No clear signs of manipulation were found.').length).toBeGreaterThan(0)
    expect(section().querySelector('.risk-summary')).toHaveTextContent('Few signs of manipulation were found. No single signal stands out.')
  })

  it('translates technique names and texts outside English', () => {
    showMetric(risk(), 'de')
    expect(chip()).toHaveTextContent('Hohes Risiko')
    cleanup()
    show(risk(), 'de')
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
    expect(section().querySelector('.risk-dim-note .sr-only')).toHaveTextContent(text)
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
    openCaveats()
    expect(screen.getByText('The propaganda-pattern signal was weak, so the overall rating was lowered.')).toBeInTheDocument()
    cleanup()
    showMetric(risk({ score: 0.1669, band: 'low' }))
    expect(document.querySelector('strong')).toHaveTextContent('17%')
    expect(chip()).toHaveTextContent('Low risk')
  })

  it('unavailable: no percentage or band, reason explained, caveats and info button kept', () => {
    show(unavailable({ caveats: [{ id: 'content_not_reader', text: 'a' }] }))
    expect(section().querySelector('.risk-chip')).toBeNull()
    expect(section()).toHaveTextContent('No risk score could be given. There were not enough signals in the content to rate it.')
    expect(screen.getByRole('button', { name: 'What does the risk score mean?' })).toBeInTheDocument()
    openCaveats()
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
    expect(section().querySelector('.risk-chip')).toBeNull()
    expect(section()).toHaveTextContent('The rating was not available for this job.')
    cleanup()
    showMetric(risk(extra))
    expect(document.querySelector('strong')).toHaveTextContent(/^—$/)
    expect(chip()).toBeNull()
  })

  it.each([['null', null], ['undefined', undefined], ['a string', 'x']])('risk %s renders nothing', (_n, r) => {
    const { container } = show(r)
    expect(container).toBeEmptyDOMElement()
  })

  it('survives a risk with missing members', () => {
    show({ status: 'scored', score: 0.5, band: 'high', drivers: [{ kind: 'amplification' }], dimensions: null, techniques: 'x', caveats: null })
    expect(section().querySelector('.risk-summary')).toBeInTheDocument()
    expect(screen.queryAllByRole('meter')).toHaveLength(0)
    openCaveats()
    expect(screen.getByText('This rating describes the content, not whether a reader will be manipulated.')).toBeInTheDocument()
  })
})

describe('RiskScore: dimensions and techniques structure', () => {
  const noAmp = { amplification: { available: false, score: null, reason: 'no_author_context' } }

  it('unavailable amplification: n/a, short reason, decorative track, no meter, full sentence for screen readers', () => {
    show(risk({ dimensions: { ...risk().dimensions, ...noAmp } }))
    const cell = section().querySelectorAll('.risk-dim')[2]
    expect(cell.querySelector('.risk-dim-value')).toHaveTextContent('n/a')
    expect(cell.querySelector('.risk-dim-note')).toHaveTextContent('No author information')
    expect(cell.querySelector('.risk-dim-note')).toHaveAttribute('title', 'No author information')
    expect(cell.querySelector('.risk-meter')).toHaveAttribute('aria-hidden', 'true')
    expect(cell.querySelector('[role=meter]')).toBeNull()
    expect(cell.querySelector('.sr-only')).toHaveTextContent('Amplification: no author information was available.')
  })

  it('unknown reason uses the unknown short reason', () => {
    show(risk({ dimensions: { ...risk().dimensions, amplification: { available: false, score: null, reason: 'something_new' } } }))
    expect(section().querySelectorAll('.risk-dim-note')[2]).toHaveTextContent('Input not available')
  })

  it('scored, low-confidence and unavailable cells share one row structure', () => {
    show(risk({ dimensions: { intensity: { available: true, score: 0.4, confidence: 'low' }, confirmation: { available: true, score: 0.8, confidence: 'normal' }, ...noAmp } }))
    const cells = [...section().querySelectorAll('.risk-dim')]
    expect(cells).toHaveLength(3)
    for (const c of cells) {
      expect([...c.children].map((e) => e.className.split(' ')[0])).toEqual(['risk-dim-row', 'risk-meter', 'risk-dim-note'])
      expect(c.querySelector('.risk-dim-label')).toBeInTheDocument()
      expect(c.querySelector('.risk-dim-value')).toBeInTheDocument()
    }
    expect(cells[0].querySelector('.risk-low')).toHaveTextContent('Low confidence')
    expect(cells[1].querySelector('.risk-low')).toBeNull()
    expect(cells[1].querySelector('.risk-dim-note')).toBeEmptyDOMElement()
  })

  it('a technique row holds name, percentage and impact badge in that order', () => {
    show(risk())
    const row = section().querySelector('.risk-techniques li') as HTMLElement
    expect([...row.children].map((e) => e.className)).toEqual(['risk-tech-name', 'risk-tech-pct', 'risk-tech-impact'])
    expect([...row.children].map((e) => e.textContent)).toEqual(['Appeal to fear', '90%', 'High impact'])
  })
})

describe('RiskScore: unknown ids and plain text', () => {
  it('unknown band: moderate colours, the id and the server summary', () => {
    showMetric(risk({ band: 'extreme' }))
    expect(chip()).toHaveTextContent('extreme')
    expect(chip().dataset.band).toBe('moderate')
    cleanup()
    show(risk({ band: 'extreme' }))
    expect(section().querySelector('.risk-summary')).toHaveTextContent('Server summary: high risk.')
  })

  it('unknown driver kind and caveat id use the server text, as plain text', () => {
    show(risk({ drivers: [{ kind: 'novel', technique: null, text: '<b>driver</b>' }], caveats: [{ id: 'content_not_reader', text: 'x' }, { id: 'novel', text: '<b>caveat</b>' }] }))
    openCaveats()
    openDrivers()
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
    openCaveats()
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

  it('keeps the caveats collapsed by default and expands and collapses them', () => {
    show(risk())
    const btn = screen.getByRole('button', { name: /Caveats/ })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(btn).toHaveAttribute('aria-controls')
    expect(screen.queryByRole('region', { name: 'Caveats' })).toBeNull()
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(within(section()).getByRole('region', { name: 'Caveats' })).toBeInTheDocument()
    expect(screen.getByText(/describes the content/)).toBeInTheDocument()
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/describes the content/)).toBeNull()
  })

  const five = [0.9, 0.8, 0.7, 0.6, 0.5].map((probability, i) => ({ label: `T${i}`, display: `Tech ${i}`, probability, impact: 'high' }))
  const drivers = ['propaganda_pattern', 'amplification', 'a', 'b'].map((kind) => ({ kind, technique: null, text: `driver ${kind}` }))

  it('shows 3 techniques and toggles Show all (N) / Show less with aria-expanded and aria-controls', () => {
    show(risk({ techniques: five }))
    const list = () => section().querySelectorAll('.risk-techniques li')
    expect(list()).toHaveLength(3)
    const btn = screen.getByRole('button', { name: 'Show all (5)' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById(btn.getAttribute('aria-controls')!)).toBe(section().querySelector('.risk-techniques'))
    fireEvent.click(btn)
    expect(list()).toHaveLength(5)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(btn).toHaveTextContent('Show less')
    fireEvent.click(btn)
    expect(list()).toHaveLength(3)
  })

  it('Main drivers: collapsed, count in the label, lists all drivers without Show all, collapses again', () => {
    show(risk({ drivers: [...drivers, { kind: 'c', technique: null, text: 'driver c' }] }))
    const btn = screen.getByRole('button', { name: 'Main drivers (5)' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(btn).toHaveAttribute('aria-controls')
    expect(screen.queryByRole('region', { name: 'Main drivers' })).toBeNull()
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    const region = within(section()).getByRole('region', { name: 'Main drivers' })
    expect(region.id).toBe(btn.getAttribute('aria-controls'))
    expect(region.querySelectorAll('li')).toHaveLength(5)
    expect(screen.queryByRole('button', { name: /Show all/ })).toBeNull()
    fireEvent.click(btn)
    expect(screen.queryByRole('region', { name: 'Main drivers' })).toBeNull()
  })

  it('Caveats and Main drivers share the .risk-toggle class; unavailable has no drivers disclosure', () => {
    show(risk())
    expect(screen.getByRole('button', { name: 'Main drivers (2)' })).toHaveClass('risk-toggle')
    expect(screen.getByRole('button', { name: /Caveats/ })).toHaveClass('risk-toggle')
    cleanup()
    show(unavailable())
    expect(screen.queryByRole('button', { name: /Main drivers/ })).toBeNull()
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
    showMetric(risk(), 'ar')
    expect(chip()).toHaveTextContent(CATALOGS.ar['results.risk.band.high'])
    cleanup()
    show(risk(), 'ar')
    expect(section().textContent).not.toContain('…')
    const keys = ['na', 'reason_short.no_author_context', 'reason_short.analyzer_unavailable', 'reason_short.no_bot_score', 'reason_short.no_scores', 'reason_short.unknown', 'drivers_count']
    for (const k of keys) expect(CATALOGS.ar[`results.risk.${k}`], k).toBeTruthy()
    expect(section().querySelector('.risk-toggle')).toHaveTextContent(CATALOGS.ar['results.risk.drivers_count'].replace('({n})', '(2)'))
    cleanup()
    show(risk({ dimensions: { ...risk().dimensions, amplification: { available: false, score: null, reason: 'no_author_context' } } }), 'ar')
    expect(section().querySelector('.risk-dim-na')).toHaveTextContent(CATALOGS.ar['results.risk.na'])
    expect(section().querySelectorAll('.risk-dim-note')[2]).toHaveTextContent(CATALOGS.ar['results.risk.reason_short.no_author_context'])
  })
  it.each(Object.keys(CATALOGS))('%s has every new risk key', (lng) => {
    for (const k of ['na', 'reason_short.no_author_context', 'reason_short.analyzer_unavailable', 'reason_short.no_bot_score', 'reason_short.no_scores', 'reason_short.unknown', 'drivers_count'])
      expect(CATALOGS[lng][`results.risk.${k}`], `${lng} ${k}`).toBeTruthy()
    expect(CATALOGS[lng]['results.risk.drivers_count']).toContain('{n}')
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
  const riskCss = readFileSync('src/job/riskScore.css', 'utf8')
  it('uses no colour literals and no font-weight above 600', () => {
    expect(riskCss).not.toMatch(/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch|hwb)\(/i)
    expect(riskCss).not.toMatch(/var\(--fw-extrabold\)|font-weight:\s*([7-9]\d\d|bold)/)
  })
  it('uses logical properties only', () => {
    expect(riskCss).not.toMatch(/(margin|padding|border)-(left|right)|(^|[\s{;])(left|right)\s*:|text-align:\s*(left|right)|[^-]width:|[^-]height:/m)
  })
})
