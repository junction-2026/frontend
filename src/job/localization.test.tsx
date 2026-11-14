import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider, LOCALES, formatNumber, useLocale, type Locale } from '../i18n'
import { CATALOGS, translate } from '../i18n/translate'
import ResultsView from '../views/ResultsView'
import DetailView from '../views/DetailView'
import { clearLocalizationCache, languageName, needsLocalization } from './localize'
import { assessment, finalization, job, json, run } from './fixtures'

const IDS = [
  'Loaded_Language', 'Appeal_to_fear-prejudice', 'Exaggeration,Minimisation', 'Repetition', 'Flag-Waving', 'Name_Calling,Labeling',
  'Reductio_ad_hitlerum', 'Black-and-White_Fallacy', 'Causal_Oversimplification', 'Whataboutism,Straw_Men,Red_Herring', 'Straw_Man',
  'Red_Herring', 'Doubt', 'Appeal_to_Authority', 'Thought-terminating_Cliches', 'Bandwagon', 'Slogans',
  'Obfuscation,Intentional_Vagueness,Confusion', 'evidence_certainty_mismatch', 'misleading_headline', 'statistical_cherry_picking',
]
const CODES = LOCALES.map((l) => l.code)

describe('technique catalog', () => {
  it.each(CODES)('%s has a name and definition for every technique id and the why templates', (lng) => {
    for (const id of IDS) {
      expect(CATALOGS[lng][`techniques.${id}.name`], `${lng} ${id} name`).toBeTruthy()
      expect(CATALOGS[lng][`techniques.${id}.definition`], `${lng} ${id} definition`).toBeTruthy()
    }
    expect(CATALOGS[lng]['techniques.why_span']).toContain('{span}')
    expect(CATALOGS[lng]['techniques.why_span']).toContain('{name}')
    expect(CATALOGS[lng]['techniques.why_no_span']).toContain('{name}')
    expect(CATALOGS[lng]['techniques.why_no_span']).not.toContain('{span}')
  })
})

// One finished analysis of French content (explanation_language fr), as the backend writes it.
const CONTENT = 'Ce sont des mensonges, tout le monde le sait. Les statistiques prouvent 300 % de hausse.'
const TITLE = 'Le vaccin TUE des milliers de personnes'
const FR_USER_TEXT = 'Ce texte cherche à effrayer le lecteur et présente des chiffres choisis.'
const span = (technique: string, text: string, field = CONTENT) => ({ technique, text, start: field.indexOf(text), end: field.indexOf(text) + text.length })
const plainFr = (name: string, text: string) => ({
  name: `${name} (fr)`, definition: `Définition de ${name} (fr)`, why: `Le passage « ${text} » a été signalé comme : ${name} (fr).`,
})
const detection = (name: string, text: string, extra: Record<string, unknown> = {}) => ({
  name, display: name, explanation: 'Words chosen to trigger strong emotions', models: ['nci-social'], strength: 'strong',
  spans: [{ ...span(name, text), why: plainFr(name, text).why }], plain_language: plainFr(name, text), ...extra,
})
const llmFinding = (label: string, field: string, text: string, explanation: string) => ({
  label, source: 'llm', name: `${label} (fr)`, definition: `Définition de ${label} (fr)`, explanation, confidence: 0.8,
  span: { field, text, start: (field === 'title' ? TITLE : CONTENT).indexOf(text), end: (field === 'title' ? TITLE : CONTENT).indexOf(text) + text.length },
})
const FINDINGS = [
  llmFinding('statistical_cherry_picking', 'content', '300 % de hausse', 'Les chiffres sont choisis pour appuyer la conclusion.'),
  llmFinding('misleading_headline', 'title', 'TUE des milliers', 'Le titre affirme plus que le texte.'),
]
const analysis = (extra: Record<string, unknown> = {}) =>
  job({
    input: { content: CONTENT, source: { title: TITLE } },
    analyzers: [
      run('translation', 'succeeded', { result: { source_language: 'fr', translated: true } }),
      run('techniques', 'succeeded', {
        result: { explanation_language: 'fr', span_status: 'ok', detected: [detection('Loaded_Language', 'mensonges'), detection('Doubt', 'tout le monde le sait', { strength: 'weak' })] },
      }),
      run('llm_techniques', 'succeeded', { result: { explanation_language: 'fr', findings: FINDINGS } }),
    ],
    finalization: finalization('completed', { result: assessment({ user_text: FR_USER_TEXT, verdict: 'detected', confidence: 0.86 }) }),
    ...extra,
  })

// What the backend returns per UI language (the text itself is a stand-in for the machine translation).
const localization = (lng: string, over: Record<string, unknown> = {}) => ({
  job_id: 'j1', language: lng,
  final_assessment: { user_text: { status: 'translated', text: `[${lng}] user text`, source_language: 'fr' } },
  llm_findings: FINDINGS.map((f, index) => ({ index, label: f.label, explanation: { status: 'translated', text: `[${lng}] ${f.label} explanation`, source_language: 'fr' } })),
  ...over,
})

const fetchMock = vi.fn()
const urls = () => fetchMock.mock.calls.map(([u]) => String(u))
const locRequests = () => urls().filter((u) => u.includes('/localization'))
// Serves the job and the localization of any language; `loc` overrides the localization response.
const serve = (j: unknown, loc: (lng: string) => Response = (lng) => json(localization(lng))) =>
  fetchMock.mockImplementation(async (u: string) => {
    const m = /\/localization\?language=(\w+)/.exec(u)
    return m ? loc(m[1]) : json(j)
  })

beforeEach(() => vi.stubGlobal('fetch', fetchMock))
afterEach(() => {
  cleanup()
  clearLocalizationCache()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  localStorage.clear()
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
})

const Switch = ({ to }: { to: Locale }) => {
  const { setLocale } = useLocale()
  return <button onClick={() => setLocale(to)}>{`switch-${to}`}</button>
}
const mount = (lng: string, ui = <ResultsView id="j1" />) => {
  localStorage.setItem('veil.locale', lng)
  return render(<I18nProvider><Switch to="fr" /><Switch to="ar" /><Switch to="de" /><Switch to="en" />{ui}</I18nProvider>)
}
const loaded = () => waitFor(() => expect(document.querySelector('.verdict-user-text')).not.toBeNull())
const open = async () => {
  await loaded()
  const btn = document.querySelector('.results-actions button.btn-primary') as HTMLElement
  if (btn.getAttribute('aria-expanded') !== 'true') fireEvent.click(btn)
}

// Page text without original evidence (content, quotes, spans, anchors), which stays in the source language.
const chromeText = () => {
  const root = document.body.cloneNode(true) as HTMLElement
  root.querySelectorAll('bdi, mark, [data-testid=job-text], [data-testid=job-title], blockquote, .job-id').forEach((e) => e.remove())
  return root.textContent ?? ''
}
const FRENCH = ['(fr)', 'Définition', 'Ce texte cherche', 'Les chiffres sont choisis', 'Le titre affirme', 'Le passage', 'Langage', 'signalé']

describe('one French analysis in every locale', () => {
  it.each(CODES)('%s: localized technique names, definitions and why, no French outside the quotations', async (lng) => {
    serve(analysis())
    mount(lng)
    await open()
    const name = (id: string) => CATALOGS[lng][`techniques.${id}.name`]
    const list = document.querySelector('.job-techniques') as HTMLElement
    if (lng === 'fr') {
      // content language = UI language: the API's own plain_language is shown, and no localization is requested
      expect(within(list).getByText('Loaded_Language (fr)')).toBeInTheDocument()
      expect(locRequests()).toEqual([])
      expect(screen.getByText(FR_USER_TEXT)).toBeInTheDocument()
    } else {
      expect(within(list).getByText(name('Loaded_Language'))).toBeInTheDocument()
      expect(within(list).getByText(CATALOGS[lng]['techniques.Loaded_Language.definition'])).toBeInTheDocument()
      expect(within(list).getByText(name('Doubt'))).toBeInTheDocument()
      const tags = [...document.querySelectorAll('.tags .tag')].map((e) => e.textContent)
      expect(tags).toEqual([name('Loaded_Language'), name('Doubt')])
      // LLM group: catalog name and definition by label, translated explanation, verbatim quote in bdi
      const llm = document.querySelector('.job-llm') as HTMLElement
      expect(within(llm).getByText(name('statistical_cherry_picking'))).toBeInTheDocument()
      expect(within(llm).getByText(`[${lng}] statistical_cherry_picking explanation`)).toBeInTheDocument()
      expect(llm.querySelector('blockquote bdi[dir=auto]')?.textContent).toBe('300 % de hausse')
      // verdict text translated and labelled with the source language
      await waitFor(() => expect(screen.getByText(`[${lng}] user text`)).toBeInTheDocument())
      expect(screen.getAllByText(translate(lng as Locale, 'results.loc.machine_translated', { language: languageName('fr', lng) })).length).toBeGreaterThan(0)
      expect(locRequests()).toHaveLength(1)
      // highlight why: catalog template with the span text verbatim
      const mark = document.querySelector('mark[data-techniques="Loaded_Language"]') as HTMLElement
      fireEvent.focus(mark)
      expect(screen.getByRole('region', { name: translate(lng as Locale, 'results.jobview.why_region') })).toHaveTextContent(
        translate(lng as Locale, 'techniques.why_span', { name: name('Loaded_Language'), span: 'mensonges' }),
      )
      for (const w of FRENCH) expect(chromeText(), `${lng} leaks "${w}"`).not.toContain(w)
    }
    // verbatim original evidence, isolated from the surrounding direction
    expect(list.querySelector('.anchor bdi[dir=auto]')?.textContent).toBe('mensonges')
    expect(document.querySelector('[data-testid=job-text]')).toHaveAttribute('dir', 'auto')
    expect(document.querySelector('mark[data-techniques="Loaded_Language"]')?.textContent).toBe('mensonges')
    // same verdict, confidence and strengths in every language
    expect(document.querySelector('[data-verdict]')).toHaveAttribute('data-verdict', 'detected')
    const squash = (v: string | null) => (v ?? '').replace(/\s/g, '') // fr/de/fi use a no-break space
    expect(squash(document.querySelector('.verdict-confidence')!.textContent)).toContain(squash(formatNumber(0.86, { style: 'percent' }, lng as Locale)))
    expect([...list.querySelectorAll('.badge-soft')].filter((b) => !b.textContent?.includes('ID') && !b.textContent?.includes('Loaded') && !b.textContent?.includes('Doubt')).map((b) => b.textContent)).toEqual([
      CATALOGS[lng]['results.jobview.strength.strong'], CATALOGS[lng]['results.jobview.strength.weak'],
    ])
  })

  it('shows the same technique term on the detail page', async () => {
    serve(analysis())
    mount('de', <DetailView id="j1" />)
    expect(await screen.findByText(CATALOGS.de['techniques.Loaded_Language.name'], { selector: '.job-technique-name' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('[de] user text')).toBeInTheDocument())
    expect(screen.getAllByText('Maschinell übersetzt aus: Französisch').length).toBeGreaterThan(0)
  })
})

describe('language switch', () => {
  it('requests one localization per new language, never re-fetches the job and keeps the open section', async () => {
    serve(analysis())
    mount('fr')
    await open()
    expect(locRequests()).toEqual([])
    const jobFetches = () => urls().filter((u) => !u.includes('/localization')).length
    expect(jobFetches()).toBe(1)

    fireEvent.click(screen.getByText('switch-ar'))
    await waitFor(() => expect(screen.getByText('[ar] user text')).toBeInTheDocument())
    expect(locRequests()).toEqual(['/api/v1/jobs/j1/localization?language=ar'])
    expect(screen.getByRole('region', { name: translate('ar', 'results.detailed_region') })).toBeInTheDocument() // still open
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')

    fireEvent.click(screen.getByText('switch-de'))
    await waitFor(() => expect(screen.getByText('[de] user text')).toBeInTheDocument())
    fireEvent.click(screen.getByText('switch-ar'))
    await waitFor(() => expect(screen.getByText('[ar] user text')).toBeInTheDocument())
    fireEvent.click(screen.getByText('switch-fr'))
    expect(screen.getByText(FR_USER_TEXT)).toBeInTheDocument()

    expect(locRequests()).toEqual(['/api/v1/jobs/j1/localization?language=ar', '/api/v1/jobs/j1/localization?language=de'])
    expect(jobFetches()).toBe(1)
  })

  it('does not request a localization for a job that is not done', async () => {
    serve(analysis({ done: false, status: 'running', finalization: finalization('running') }))
    mount('ar')
    await waitFor(() => expect(urls().length).toBeGreaterThan(0))
    expect(locRequests()).toEqual([])
  })

  it('keeps the original reachable behind a toggle', async () => {
    serve(analysis())
    mount('ar')
    await open()
    await waitFor(() => expect(screen.getByText('[ar] user text')).toBeInTheDocument())
    fireEvent.click(screen.getAllByRole('button', { name: translate('ar', 'results.loc.show_original') })[0])
    expect(screen.getByText(FR_USER_TEXT)).toBeInTheDocument()
    expect(screen.queryByText('[ar] user text')).toBeNull()
  })
})

describe('fallbacks', () => {
  const note = (lng: string) => translate(lng as Locale, 'results.loc.unavailable', { language: languageName(lng, lng) })
  const noRaw = () => {
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/undefined|null|\[object|techniques\.|results\.loc/)
  }

  it.each([
    ['unavailable', json(localization('ar', { final_assessment: { user_text: { status: 'unavailable', text: null, source_language: 'fr' } } }))],
    ['unknown status', json(localization('ar', { final_assessment: { user_text: { status: 'pending', text: null, source_language: null } } }))],
    ['409', json({ error: { code: 'job_not_finished', message: 'x' } }, 409)],
    ['400', json({ error: { code: 'unsupported_language', message: 'x' } }, 400)],
  ])('%s: the original text with a localized note, never presented as localized', async (_n, response) => {
    serve(analysis(), () => response.clone())
    mount('ar')
    await open()
    expect(await screen.findByText(FR_USER_TEXT)).toBeInTheDocument()
    expect(screen.getAllByText(note('ar')).length).toBeGreaterThan(0)
    expect(within(document.querySelector('.verdict-explanation') as HTMLElement).queryByText(/ترجمة آلية/)).toBeNull()
    // technique names are still the catalog's
    expect(screen.getAllByText(CATALOGS.ar['techniques.Loaded_Language.name']).length).toBeGreaterThan(0)
    noRaw()
  })

  it('a network error degrades to the original texts', async () => {
    fetchMock.mockImplementation(async (u: string) => {
      if (u.includes('/localization')) throw new TypeError('Failed to fetch')
      return json(analysis())
    })
    mount('de')
    await open()
    expect(await screen.findByText(FR_USER_TEXT)).toBeInTheDocument()
    expect(screen.getAllByText(note('de')).length).toBeGreaterThan(0)
    noRaw()
  })

  it('an unknown technique id keeps the API name and definition and warns in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const j = analysis()
    ;((j.analyzers as { result: { detected: unknown[] } }[])[1].result).detected = [detection('Brand_New_Technique', 'mensonges')]
    serve(j)
    mount('ar')
    await open()
    const list = document.querySelector('.job-techniques') as HTMLElement
    expect(within(list).getByText('Brand_New_Technique (fr)')).toBeInTheDocument()
    expect(within(list).getByText('Définition de Brand_New_Technique (fr)')).toBeInTheDocument()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Brand_New_Technique'))
  })

  it('a result without plain_language is localized by id, and shows display/explanation in English', async () => {
    const j = analysis({ analyzers: [run('techniques', 'succeeded', { result: { detected: [{ name: 'Doubt', display: 'Doubt (display)', explanation: 'Questions credibility', spans: [] }] } })] })
    serve(j)
    mount('ar')
    await open()
    expect(screen.getAllByText(CATALOGS.ar['techniques.Doubt.name']).length).toBeGreaterThan(0)
    cleanup()
    mount('en')
    await open()
    expect(screen.getByText('Questions credibility')).toBeInTheDocument()
  })
})

describe('needsLocalization', () => {
  const j = analysis() as unknown as Parameters<typeof needsLocalization>[0]
  it('is false for the content language and for unfinished jobs, true for another language', () => {
    expect(needsLocalization(j, 'fr')).toBe(false)
    expect(needsLocalization(j, 'ar')).toBe(true)
    expect(needsLocalization({ ...j, done: false }, 'ar')).toBe(false)
  })
  it('treats a fixed orchestrator text as English', () => {
    const o = analysis({ finalization: finalization('completed', { result: assessment({ produced_by: 'orchestrator', verdict: 'uncertain' }) }), analyzers: [] }) as unknown as Parameters<typeof needsLocalization>[0]
    expect(needsLocalization(o, 'fi')).toBe(true)
    expect(needsLocalization(o, 'en')).toBe(false)
  })
})
