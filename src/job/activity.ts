import type { Activity } from '../analyze/state'
import type { AnalyzerRun } from '../api/types'
import { formatNumber } from '../i18n/format'
import { CATALOGS, translate, type Params } from '../i18n/translate'
import { languageName } from './localize'
import { str } from './read'

type T = (key: string, params?: Params) => string
const has = (key: string) => CATALOGS.en[key] !== undefined
const NOTE_REASONS = ['no_checkable_claims', 'no_searchable_topics', 'no_sources', 'not_applicable', 'not_selected']

// Analyzer display name by id from the catalog; the API name (a deployment's own analyzer) otherwise.
export const analyzerName = (t: T, a: { id: string; name?: unknown }) => (has(`results.analyzer_name.${a.id}`) ? t(`results.analyzer_name.${a.id}`) : str(a.name) ?? a.id)

// The availability note of a settled run, from `reason` / `availability` (never from the English `note`); an
// availability the catalog cannot place keeps the API note.
export function availabilityNote(t: T, a: AnalyzerRun): string | null {
  const reason = a.reason === 'disabled' ? 'not_selected' : (a.reason ?? '')
  if (a.status === 'skipped' && NOTE_REASONS.includes(reason)) return t(`results.availability.note.${reason}`)
  if (a.availability === 'not_applicable') return str(a.note) ?? null
  if (a.availability == null || a.availability === 'ran') return null
  return t('results.availability.note.unavailable') // unknown availability counts as unavailable
}

const list = (items: string[], locale: string) => {
  try {
    return new Intl.ListFormat(locale, { type: 'conjunction' }).format(items)
  } catch {
    return items.join(', ')
  }
}

// Activity title by key; `text` (API) for a key the catalog does not know.
export const activityTitle = (t: T, key: string, text: string) => (has(`analysis.activity.${key}.title`) ? t(`analysis.activity.${key}.title`) : text)

// Activity detail from key and params (analysis-job-events, Activity rendering); the API detail when the params do not fit.
export function activityDetail(t: T, locale: Parameters<typeof translate>[0], a: Activity): string | null {
  const p = a.params ?? {}
  const strings = (v: unknown) => (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string') ? (v as string[]) : null)
  let out: string | null | undefined
  if (a.key === 'news_search' && strings(p.languages)) out = t('analysis.activity.news_search.detail', { languages: list(strings(p.languages)!.map((c) => languageName(c, locale)), locale) })
  else if (a.key === 'fact_check' && typeof p.claims === 'number') out = t('analysis.activity.fact_check.detail', { claims: t('analysis.preview.claims', { count: p.claims, n: formatNumber(p.claims, undefined, locale) }) })
  else if (a.key === 'techniques' && strings(p.models)?.every((m) => has(`analysis.activity.model.${m}`))) out = t('analysis.activity.techniques.detail', { models: list(strings(p.models)!.map((m) => t(`analysis.activity.model.${m}`)), locale) })
  else if (a.key === 'llm_techniques' && p.title_checked === true) out = t('analysis.activity.llm_techniques.detail')
  else if (a.key === 'scrape' && typeof p.host === 'string') out = t('analysis.activity.scrape.detail', { host: p.host })
  return out ?? a.detail
}

export const activityLine = (t: T, locale: Parameters<typeof translate>[0], a: Activity) =>
  [activityTitle(t, a.key, a.text), activityDetail(t, locale, a)].filter(Boolean).join(' ')
