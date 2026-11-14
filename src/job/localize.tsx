import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getJobLocalization } from '../api/client'
import type { Job, JobLocalization, LocalizedText } from '../api/types'
import { useLocale, useT } from '../i18n'
import { str, run } from './read'

// What the client knows about the localization of one job: `need` = the shown texts may be in another language than
// the UI; `data` = undefined while loading, null when the request failed.
export type Loc = { need: boolean; data: JobLocalization | null | undefined }
export const NO_LOC: Loc = { need: false, data: undefined }
const LocContext = createContext<Loc>(NO_LOC)
export const useLoc = () => useContext(LocContext)

const lang = (v: unknown) => (typeof v === 'string' && v !== '' ? v.toLowerCase().split('-')[0] : undefined)

// A language is only known when a run reports it; unknown never counts as "differs" (no request, no note).
// Texts: finalizer user_text (translation.source_language, or fixed English from the orchestrator) and LLM explanations.
export function needsLocalization(job: Job, locale: string): boolean {
  if (job.done !== true) return false
  const result = job.finalization?.result
  const userText = result && str(result.user_text) ? (result.produced_by === 'orchestrator' ? 'en' : lang((run(job, 'translation')?.result as { source_language?: unknown } | null)?.source_language)) : undefined
  const llm = run(job, 'llm_techniques')
  const llmRes = llm?.status === 'succeeded' ? (llm.result as { findings?: unknown; explanation_language?: unknown } | null) : null
  const findings = Array.isArray(llmRes?.findings) && llmRes.findings.length > 0 ? lang(llmRes.explanation_language) : undefined
  return [userText, findings].some((l) => l !== undefined && l !== locale)
}

// One request per (job, language) for the page's lifetime; failures and answers with an unavailable text are not kept, so a later switch retries.
const cache = new Map<string, Promise<JobLocalization | null>>()
export const clearLocalizationCache = () => cache.clear()

const usable = (e: LocalizedText | undefined) => e?.status === 'original' || e?.status === 'translated'
const settled = (d: JobLocalization) => (!d.final_assessment || usable(d.final_assessment.user_text)) && (d.llm_findings ?? []).every((f) => usable(f?.explanation))

function fetchLocalization(jobId: string, language: string): Promise<JobLocalization | null> {
  const key = `${jobId}\n${language}`
  let p = cache.get(key)
  if (!p) {
    p = getJobLocalization(jobId, language).then((r) => {
      const ok = r.ok && typeof r.data === 'object' && r.data !== null && typeof r.data.language === 'string'
      const data = ok && r.ok ? r.data : null
      if (!data || !settled(data)) cache.delete(key) // an unavailable text is not remembered: a later switch asks again
      return data
    })
    cache.set(key, p)
  }
  return p
}

// Provides the localization of a done job to its texts. A language switch only adds a request for the new language.
export function LocalizationProvider({ job, children }: { job: Job; children: ReactNode }) {
  const { locale } = useLocale()
  const need = needsLocalization(job, locale)
  const key = `${job.id}\n${locale}`
  const [res, setRes] = useState<{ key: string; data: JobLocalization | null } | null>(null)
  useEffect(() => {
    if (!need) return
    let stale = false
    void fetchLocalization(job.id, locale).then((data) => !stale && setRes({ key, data }))
    return () => {
      stale = true
    }
  }, [need, key, job.id, locale])
  return <LocContext.Provider value={{ need, data: res?.key === key ? res.data : undefined }}>{children}</LocContext.Provider>
}

export const userTextEntry = (l: Loc): LocalizedText | null => l.data?.final_assessment?.user_text ?? null
export const findingEntry = (l: Loc, index: number, label: string): LocalizedText | null =>
  l.data?.llm_findings?.find((f) => f?.index === index && f.label === label)?.explanation ?? null

// Language name in the UI language ("français"); the code itself when Intl cannot name it.
export function languageName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'language' }).of(code) ?? code
  } catch {
    return code
  }
}

// The machine translation of an entry, or null (original, unavailable, unknown status, no text).
export const translatedOf = (entry: LocalizedText | null | undefined) =>
  entry?.status === 'translated' && typeof entry.text === 'string' && entry.text !== '' ? entry.text : null

// The text to show and the marker that goes with it. Only a `translated` text counts as localized; an unknown or
// unavailable status, a failed request or a missing entry shows the original with a "not available" note.
export function useLocalizedText(original: string, entry: LocalizedText | null): { text: string; note: ReactNode } {
  const t = useT()
  const { locale } = useLocale()
  const { need, data } = useLoc()
  const [showOriginal, setShowOriginal] = useState(false)
  if (!need || data === undefined) return { text: original, note: null }
  const translated = translatedOf(entry)
  if (entry?.status === 'original') return { text: original, note: null }
  if (!translated)
    return { text: original, note: <span role="note" className="loc-note">{t('results.loc.unavailable', { language: languageName(locale, locale) })}</span> }
  const from = lang(entry?.source_language)
  return {
    text: showOriginal ? original : translated,
    note: (
      <span className="loc-note">
        {from ? t('results.loc.machine_translated', { language: languageName(from, locale) }) : t('results.loc.machine_translated_unknown')}
        {' '}
        <button type="button" className="btn-link" aria-pressed={showOriginal} onClick={() => setShowOriginal(!showOriginal)}>
          {showOriginal ? t('results.loc.show_translation') : t('results.loc.show_original')}
        </button>
      </span>
    ),
  }
}
