import type { Job, Verdict } from '../api/types'
import type { Locale } from '../i18n'
import type { Params } from '../i18n/translate'
import { readLlm, readTechniques, run, techniqueInfo, type Detection } from './read'
import { validSpans } from './segments'

type T = (key: string, params?: Params) => string
type Fmt = (v: number) => string

export type InfoCard = { key: string; label: string; value: string; status?: string; neutral?: boolean }

const contentOf = (job: Job) => (typeof job.input?.content === 'string' ? job.input.content : '')

// Strong detections of a succeeded techniques run, best first; null when that run is missing, failed or skipped.
// Without a `strength` (results stored before it existed) an entry is strong when it has a valid span.
function rankedStrong(job: Job): Detection[] | null {
  const read = readTechniques(job)
  if (!read) return null
  const content = contentOf(job)
  const rows = read.detected.flatMap((d) => {
    const spans = validSpans(content, d.spans).length
    const margin = (d as { margin?: unknown }).margin
    return d.strength === 'strong' || (d.strength == null && spans > 0) ? [{ d, spans, located: spans > 0, margin: typeof margin === 'number' && Number.isFinite(margin) ? margin : 0 }] : []
  })
  rows.sort((a, b) => Number(b.located) - Number(a.located) || b.margin - a.margin || b.spans - a.spans || (a.d.name < b.d.name ? -1 : a.d.name > b.d.name ? 1 : 0))
  return rows.map((r) => r.d)
}

// null: no card (techniques run unusable); top null: no strong technique.
export function topTechnique(job: Job): { top: Detection | null } | null {
  const ranked = rankedStrong(job)
  return ranked && { top: ranked[0] ?? null }
}

// Passages located in the content by the techniques and by LLM findings, overlapping or identical ranges counted once;
// null when neither run succeeded.
export function evidencePassages(job: Job): number | null {
  const content = contentOf(job)
  const tech = readTechniques(job)
  const llm = readLlm(job)
  if (!tech && (!llm || llm.unavailable)) return null
  const ranges = [
    ...(tech?.detected ?? []).flatMap((d) => validSpans(content, d.spans)),
    ...(llm?.findings ?? []).filter((f) => f.span.field === 'content').flatMap((f) => validSpans(content, [{ ...f.span, technique: f.label }])),
  ]
    .map((s) => [s.start, s.end] as const)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
  let count = 0
  let end = -1
  for (const [s, e] of ranges) {
    if (s >= end) count++
    end = Math.max(end, e)
  }
  return count
}

export type FactChecks = { kind: 'count'; n: number } | { kind: 'unavailable' } | { kind: 'absent' } | null

// The fact_check run: its match count, unavailable when failed or skipped, absent without a run, null while unsettled.
export function factChecks(job: Job): FactChecks {
  const r = run(job, 'fact_check')
  if (!r) return { kind: 'absent' }
  if (r.status === 'failed' || r.status === 'skipped') return { kind: 'unavailable' }
  if (r.status !== 'succeeded') return null
  const list = (r.result as { fact_checks?: unknown } | null)?.fact_checks
  return { kind: 'count', n: Array.isArray(list) ? list.length : 0 }
}

// The up to three info cards under the summary.
export function cardsOf(job: Job, verdict: Verdict, locale: Locale, t: T, fmt: Fmt): InfoCard[] {
  const cards: InfoCard[] = []
  const top = topTechnique(job)
  if (top) {
    const label = t('results.cards.technique.label')
    if (top.top) {
      const name = techniqueInfo(top.top, locale, readTechniques(job)?.lang).name
      cards.push({ key: 'technique', label, value: name, status: t(verdict === 'detected' ? 'results.cards.technique.detected' : 'results.cards.technique.signal') })
    } else cards.push({ key: 'technique', label, value: t('results.cards.technique.none'), neutral: true })
  }
  const passages = evidencePassages(job)
  if (passages !== null) {
    const label = t('results.cards.evidence.label')
    cards.push(
      passages > 0
        ? { key: 'evidence', label, value: t('results.cards.evidence.passages', { count: passages, n: fmt(passages) }), status: t('results.cards.evidence.located') }
        : { key: 'evidence', label, value: t('results.cards.evidence.none'), neutral: true },
    )
  }
  const fact = factChecks(job)
  if (fact?.kind === 'count') {
    const label = t('results.cards.fact.label')
    cards.push(
      fact.n > 0
        ? { key: 'fact', label, value: t('results.cards.fact.matches', { count: fact.n, n: fmt(fact.n) }), status: t('results.cards.fact.found') }
        : { key: 'fact', label, value: t('results.cards.fact.none'), neutral: true },
    )
  } else if (fact?.kind === 'unavailable') cards.push({ key: 'fact', label: t('results.cards.fact.label'), value: t('results.cards.fact.unavailable'), neutral: true })
  else if (fact?.kind === 'absent') {
    const n = rankedStrong(job)?.length
    if (n !== undefined) {
      const label = t('results.cards.techniques.label')
      cards.push(
        n > 0
          ? { key: 'techniques', label, value: t('results.cards.techniques.count', { count: n, n: fmt(n) }), status: t('results.cards.techniques.supported') }
          : { key: 'techniques', label, value: t('results.cards.techniques.none'), neutral: true },
      )
    }
  }
  return cards
}
