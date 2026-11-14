import type { Job } from '../api/types'

export const DIMENSIONS = ['intensity', 'confirmation', 'amplification'] as const
export type DimensionKey = (typeof DIMENSIONS)[number]

export type RiskView = {
  scored: boolean
  score: number | null // 0..1, only when scored
  band: string | null // only when scored
  reason: string | null
  summary: string
  dimensions: { key: DimensionKey; available: boolean; score: number | null; low: boolean; reason: string | null }[]
  techniques: { label: string; display: string; probability: number; impact: string }[]
  drivers: { kind: string; technique: string | null; text: string }[]
  caveats: { id: string; text: string }[]
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const ratio = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1 ? v : null)
const list = (v: unknown) => (Array.isArray(v) ? v.filter(isObj) : [])

// null when `risk` is null, missing or not an object (the screen then shows no risk content at all). A `scored` risk that lacks
// a score, a band or a driver, and any unknown status, reads as unavailable: a score is never shown without its context.
export function readRisk(job: Job): RiskView | null {
  const r = job.risk
  if (!isObj(r)) return null
  const dims: Record<string, unknown> = isObj(r.dimensions) ? r.dimensions : {}
  const dimensions = DIMENSIONS.map((key) => {
    const d: Record<string, unknown> = isObj(dims[key]) ? dims[key] : {}
    const score = ratio(d.score)
    const available = d.available === true && score !== null
    return { key, available, score, low: available && (d.confidence === 'low' || d.basis === 'single_text'), reason: str(d.reason) || null }
  })
  const techniques = list(r.techniques).flatMap((t) =>
    typeof t.label === 'string' && ratio(t.probability) !== null
      ? [{ label: t.label, display: str(t.display), probability: t.probability as number, impact: str(t.impact) }]
      : [],
  )
  const drivers = list(r.drivers).flatMap((d) => (typeof d.kind === 'string' ? [{ kind: d.kind, technique: str(d.technique) || null, text: str(d.text) }] : []))
  const caveats = list(r.caveats).flatMap((c) => (typeof c.id === 'string' ? [{ id: c.id, text: str(c.text) }] : []))
  if (!caveats.some((c) => c.id === 'content_not_reader')) caveats.unshift({ id: 'content_not_reader', text: '' })
  const score = ratio(r.score)
  const band = str(r.band) || null
  const scored = r.status === 'scored' && score !== null && band !== null && drivers.length > 0
  return {
    scored,
    score: scored ? score : null,
    band: scored ? band : null,
    reason: str(r.reason) || null,
    summary: str(r.summary),
    dimensions,
    techniques,
    drivers: scored ? drivers : [],
    caveats,
  }
}
