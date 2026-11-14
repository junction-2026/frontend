import type { Job } from '../api/types'
import { CATALOGS, translate } from '../i18n/translate'
import type { Locale } from '../i18n/locales'

export type Detection = { name: string; display: string; explanation: string; spans?: unknown; plain_language?: unknown; strength?: unknown }
export type Techniques = { detected: Detection[]; spanStatus: unknown; lang: string | undefined }
export type Finding = { index: number; label: string; name: string; definition: string; explanation: string; span: Record<string, unknown> }
export type Llm = { unavailable: boolean; findings: Finding[]; lang: string | undefined }

const LLM_LABELS = ['evidence_certainty_mismatch', 'misleading_headline', 'statistical_cherry_picking']
export const str = (v: unknown) => (typeof v === 'string' && v !== '' ? v : undefined)

export const run = (job: Job, id: string) => job.analyzers?.find((a) => a.id === id)

// null when the techniques run is missing, not succeeded or has no usable result.
export function readTechniques(job: Job): Techniques | null {
  const r = run(job, 'techniques')
  const res = r?.result as { detected?: unknown; span_status?: unknown; explanation_language?: unknown } | null | undefined
  if (r?.status !== 'succeeded' || typeof res !== 'object' || res === null || !Array.isArray(res.detected)) return null
  const detected = res.detected.filter(
    (d): d is Detection => typeof d === 'object' && d !== null && typeof (d as Detection).name === 'string',
  )
  return { detected, spanStatus: res.span_status, lang: str(res.explanation_language) }
}

// null when the run is absent or still pending; findings with an unknown label or missing texts are ignored.
export function readLlm(job: Job): Llm | null {
  const r = run(job, 'llm_techniques')
  if (!r) return null
  if (r.status === 'failed' || r.status === 'skipped') return { unavailable: true, findings: [], lang: undefined }
  const res = r.result as { findings?: unknown; explanation_language?: unknown } | null | undefined
  if (r.status !== 'succeeded' || typeof res !== 'object' || res === null || !Array.isArray(res.findings)) return null
  const findings = res.findings.flatMap((f: unknown, index: number): Finding[] => {
    const o = (typeof f === 'object' && f !== null ? f : {}) as Record<string, unknown>
    const span = o.span
    if (typeof o.label !== 'string' || !LLM_LABELS.includes(o.label)) return []
    if (typeof span !== 'object' || span === null || !str(o.name) || !str(o.definition) || !str(o.explanation)) return []
    return [{ index, label: o.label, name: o.name as string, definition: o.definition as string, explanation: o.explanation as string, span: span as Record<string, unknown> }]
  })
  return { unavailable: false, findings, lang: str(res.explanation_language) }
}

export function plain(d: Detection) {
  const p = (typeof d.plain_language === 'object' && d.plain_language !== null ? d.plain_language : {}) as Record<string, unknown>
  return { name: str(p.name), definition: str(p.definition), why: str(p.why) }
}

const warned = new Set<string>()
const known = (id: string) => CATALOGS.en[`techniques.${id}.name`] !== undefined && CATALOGS.en[`techniques.${id}.definition`] !== undefined

// Name and definition of a technique by its stable id (classifier name or LLM label). The client catalog is used when the
// UI language differs from `apiLang`, the language of the API texts (the result's explanation_language); otherwise, and
// for an id the catalog lacks, the API texts.
export function techniqueText(id: string, locale: Locale, apiLang: string, api: { name?: string; definition?: string }) {
  const local = apiLang !== locale
  if (local && known(id)) return { name: translate(locale, `techniques.${id}.name`), definition: translate(locale, `techniques.${id}.definition`), local: true }
  if (local && import.meta.env.DEV && !warned.has(id)) {
    warned.add(id)
    console.warn(`No catalog localization for technique id "${id}"; showing the API text`)
  }
  return { name: api.name ?? id, definition: api.definition ?? '', local: false }
}

// Detection of the techniques run: plain_language, else display and explanation, else the id. A result that names no
// language is English, unless it carries plain_language, which is then taken as already in the UI language.
export function techniqueInfo(d: Detection, locale: Locale, lang: string | undefined) {
  const p = plain(d)
  return techniqueText(d.name, locale, lang ?? (p.name ? locale : 'en'), { name: p.name ?? str(d.display), definition: p.definition ?? str(d.explanation) })
}

// "Why" of a span or detection: the API text, or the catalog template (span text verbatim) when the technique is localized.
export function whyText(info: { name: string; local: boolean }, locale: Locale, api: string | undefined, span?: string) {
  if (!api || !info.local) return api
  return span === undefined ? translate(locale, 'techniques.why_no_span', { name: info.name }) : translate(locale, 'techniques.why_span', { name: info.name, span: `\u2068${span}\u2069` }) // FSI..PDI isolates the quoted span from the surrounding direction
}

// null unless the topic_extraction run succeeded; a result without `claims` counts as none (topic-extraction-result).
export function claimCount(job: Job): number | null {
  const r = run(job, 'topic_extraction')
  if (r?.status !== 'succeeded') return null
  const claims = (r.result as { claims?: unknown } | null)?.claims
  return Array.isArray(claims) ? claims.length : 0
}

// Verdict presentation shared by Results (pill) and History (tag); unknown verdicts read as uncertain.
export const VERDICT_UI = {
  detected: { label: 'Manipulation detected', tone: 'orange' },
  not_detected: { label: 'No manipulation indicators', tone: 'green' },
  uncertain: { label: 'Uncertain', tone: 'purple' },
} as const

export const timedOut = (e: { code: string } | null | undefined) => e?.code === 'timeout'
