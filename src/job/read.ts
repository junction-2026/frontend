import type { Job } from '../api/types'

export type Detection = { name: string; display: string; explanation: string; spans?: unknown; plain_language?: unknown }
export type Techniques = { detected: Detection[]; spanStatus: unknown }
export type Finding = { label: string; name: string; definition: string; explanation: string; span: Record<string, unknown> }
export type Llm = { unavailable: boolean; findings: Finding[] }

const LLM_LABELS = ['evidence_certainty_mismatch', 'misleading_headline', 'statistical_cherry_picking']
export const str = (v: unknown) => (typeof v === 'string' && v !== '' ? v : undefined)

export const run = (job: Job, id: string) => job.analyzers?.find((a) => a.id === id)

// null when the techniques run is missing, not succeeded or has no usable result.
export function readTechniques(job: Job): Techniques | null {
  const r = run(job, 'techniques')
  const res = r?.result as { detected?: unknown; span_status?: unknown } | null | undefined
  if (r?.status !== 'succeeded' || typeof res !== 'object' || res === null || !Array.isArray(res.detected)) return null
  const detected = res.detected.filter(
    (d): d is Detection => typeof d === 'object' && d !== null && typeof (d as Detection).name === 'string',
  )
  return { detected, spanStatus: res.span_status }
}

// null when the run is absent or still pending; findings with an unknown label or missing texts are ignored.
export function readLlm(job: Job): Llm | null {
  const r = run(job, 'llm_techniques')
  if (!r) return null
  if (r.status === 'failed' || r.status === 'skipped') return { unavailable: true, findings: [] }
  const res = r.result as { findings?: unknown } | null | undefined
  if (r.status !== 'succeeded' || typeof res !== 'object' || res === null || !Array.isArray(res.findings)) return null
  const findings = res.findings.flatMap((f: unknown): Finding[] => {
    const o = (typeof f === 'object' && f !== null ? f : {}) as Record<string, unknown>
    const span = o.span
    if (typeof o.label !== 'string' || !LLM_LABELS.includes(o.label)) return []
    if (typeof span !== 'object' || span === null || !str(o.name) || !str(o.definition) || !str(o.explanation)) return []
    return [{ label: o.label, name: o.name as string, definition: o.definition as string, explanation: o.explanation as string, span: span as Record<string, unknown> }]
  })
  return { unavailable: false, findings }
}

export function plain(d: Detection) {
  const p = (typeof d.plain_language === 'object' && d.plain_language !== null ? d.plain_language : {}) as Record<string, unknown>
  return { name: str(p.name), definition: str(p.definition), why: str(p.why) }
}

// Display name of a technique: plain_language.name, else display, else name.
export const techniqueName = (d: Detection) => plain(d).name ?? String(d.display ?? d.name)

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
