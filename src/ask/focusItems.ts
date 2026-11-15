import { verdictOf, type ChatFocusItem, type Job } from '../api/types'
import type { useT } from '../i18n'
import { CATALOGS } from '../i18n/translate'
import type { Locale } from '../i18n/locales'
import { resultOf } from '../job/Verdict'
import { readLlm, readTechniques, run, techniqueInfo, techniqueText } from '../job/read'
import { readRisk } from '../job/risk'
import { validSpans } from '../job/segments'

export const MAX_FOCUS = 20 // shared "ChatRequest focus validation"
const SHOWN = 120
const SENT = 500

export type FocusGroup = 'assessment' | 'techniques' | 'llm' | 'risk' | 'wikipedia' | 'terms'
// `label` is what is sent (<= 500 code points), `shown` what the page displays (<= 120); `child` marks a passage under its technique.
export type FocusEntry = ChatFocusItem & { key: string; shown: string; group: FocusGroup; child?: boolean }

type T = ReturnType<typeof useT>
const obj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const text = (v: unknown) => (typeof v === 'string' ? v : '')
const known = (key: string) => CATALOGS.en[key] !== undefined // a key a newer server uses falls back to the server text

// Whitespace runs collapse to one space; a label over `max` code points ends in "…" and still has `max` code points.
export function shorten(s: string, max: number): string {
  const c = Array.from(s.replace(/\s+/g, ' ').trim())
  return c.length <= max ? c.join('') : `${c.slice(0, max - 1).join('').trimEnd()}…`
}

// The result elements of a completed job, in panel order: assessment, techniques with their passages, LLM findings,
// risk (dimensions, drivers, caveats), Wikipedia claims, term contexts. Refs follow the shared element reference requirements;
// indexes address the raw arrays of the job, not the filtered lists the result view renders.
export function focusItemsOf(job: Job, locale: Locale, t: T): FocusEntry[] {
  if (job.status !== 'completed') return []
  const out: FocusEntry[] = []
  const seen = new Set<string>()
  const add = (group: FocusGroup, kind: string, ref: string, label: string, child?: boolean) => {
    const key = `${kind}:${ref}`
    const sent = shorten(label, SENT)
    if (!sent || seen.has(key)) return // the server treats equal kind and ref as one element
    seen.add(key)
    out.push({ key, kind, ref, label: sent, shown: shorten(label, SHOWN), group, child })
  }

  const final = resultOf(job)
  if (final) add('assessment', 'final_assessment', 'final_assessment', t(`results.verdict.label.${verdictOf(final.verdict)}`))

  const content = typeof job.input?.content === 'string' ? job.input.content : ''
  const techniques = readTechniques(job)
  for (const d of techniques?.detected ?? []) {
    add('techniques', 'technique', d.name, techniqueInfo(d, locale, techniques?.lang).name)
    for (const s of validSpans(content, d.spans)) add('techniques', 'passage', `${s.start}:${s.end}:${d.name}`, s.text, true)
  }

  const llm = readLlm(job)
  for (const f of llm?.findings ?? []) add('llm', 'llm_finding', String(f.index), techniqueText(f.label, locale, llm?.lang ?? locale, { name: f.name, definition: f.definition }).name)

  const risk = readRisk(job)
  if (risk) {
    for (const d of risk.dimensions) if (d.available) add('risk', 'risk_dimension', d.key, t(`results.risk.dim.${d.key}`))
    const nameOf = (label: string) => techniqueText(label, locale, 'en', { name: risk.techniques.find((x) => x.label === label)?.display || undefined }).name
    const raw = job.risk as Record<string, unknown>
    if (risk.scored && Array.isArray(raw.drivers)) {
      raw.drivers.forEach((d: unknown, i) => {
        if (!obj(d) || typeof d.kind !== 'string') return
        const technique = text(d.technique)
        const own = `results.risk.driver.${d.kind}`
        add('risk', 'risk_driver', String(i), d.kind === 'technique' ? (technique ? t('results.risk.driver.technique', { technique: nameOf(technique) }) : text(d.text)) : known(own) ? t(own) : text(d.text))
      })
    }
    if (Array.isArray(raw.caveats)) {
      for (const c of raw.caveats) {
        if (!obj(c) || typeof c.id !== 'string') continue
        const own = `results.risk.caveat.${c.id}`
        add('risk', 'risk_caveat', c.id, known(own) ? t(own) : text(c.text))
      }
    }
  }

  const wiki = run(job, 'wikipedia')
  if (wiki?.status === 'succeeded' && obj(wiki.result) && Array.isArray(wiki.result.claims))
    wiki.result.claims.forEach((c: unknown, i) => obj(c) && add('wikipedia', 'wikipedia_claim', String(i), text(c.claim)))

  const terms = run(job, 'term_context')
  if (terms?.status === 'succeeded' && obj(terms.result) && Array.isArray(terms.result.terms))
    terms.result.terms.forEach((c: unknown, i) => obj(c) && add('terms', 'term_context', String(i), text(c.term)))

  return out
}
