import { useState } from 'react'
import type { Detection, Job } from './api'
import { segment, validSpans, type Span } from './segments'
import { useJob } from './useJob'
import './job.css'

type Techniques = { detected: Detection[]; spanStatus: unknown }
type Finding = { label: string; name: string; definition: string; explanation: string; span: Record<string, unknown> }
type Llm = { unavailable: boolean; findings: Finding[] }
type Active = { key: string; whys: string[] }

const LLM_LABELS = ['evidence_certainty_mismatch', 'misleading_headline', 'statistical_cherry_picking']
const str = (v: unknown) => (typeof v === 'string' && v !== '' ? v : undefined)

// null when the techniques run is missing, not succeeded or has no usable result.
function readTechniques(job: Job): Techniques | null {
  const run = job.analyzers?.find((a) => a.name === 'techniques')
  const r = run?.result as { detected?: unknown; span_status?: unknown } | null | undefined
  if (run?.status !== 'succeeded' || typeof r !== 'object' || r === null || !Array.isArray(r.detected)) return null
  const detected = r.detected.filter(
    (d): d is Detection => typeof d === 'object' && d !== null && typeof (d as Detection).name === 'string',
  )
  return { detected, spanStatus: r.span_status }
}

// null when the run is absent or still pending; findings with an unknown label or missing texts are ignored.
function readLlm(job: Job): Llm | null {
  const run = job.analyzers?.find((a) => a.name === 'llm_techniques')
  if (!run) return null
  if (run.status === 'failed' || run.status === 'skipped') return { unavailable: true, findings: [] }
  const r = run.result as { findings?: unknown } | null | undefined
  if (run.status !== 'succeeded' || typeof r !== 'object' || r === null || !Array.isArray(r.findings)) return null
  const findings = r.findings.flatMap((f: unknown): Finding[] => {
    const o = (typeof f === 'object' && f !== null ? f : {}) as Record<string, unknown>
    const span = o.span
    if (typeof o.label !== 'string' || !LLM_LABELS.includes(o.label)) return []
    if (typeof span !== 'object' || span === null || !str(o.name) || !str(o.definition) || !str(o.explanation)) return []
    return [{ label: o.label, name: o.name as string, definition: o.definition as string, explanation: o.explanation as string, span: span as Record<string, unknown> }]
  })
  return { unavailable: false, findings }
}

export default function JobView({ id }: { id: string }) {
  const result = useJob(id)
  if (!result) return <p role="status">Loading…</p>
  if (!result.ok) return <p role="alert">{result.message}</p>
  return <Result job={result.job} />
}

function Result({ job }: { job: Job }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [active, setActive] = useState<Active | null>(null)
  const content = typeof job.input?.content === 'string' ? job.input.content : ''
  const rawTitle = job.input?.source?.title
  const title = typeof rawTitle === 'string' && rawTitle.trim() !== '' ? rawTitle : ''
  const techniques = readTechniques(job)
  const llm = readLlm(job)
  const plain = (d: Detection) => {
    const p = (typeof d.plain_language === 'object' && d.plain_language !== null ? d.plain_language : {}) as Record<string, unknown>
    return { name: str(p.name), definition: str(p.definition), why: str(p.why) }
  }
  const names = new Map<string, string>(
    techniques?.detected.map((d) => [d.name, plain(d).name ?? String(d.display ?? d.name)]),
  )
  const spans: Span[] = techniques
    ? techniques.detected.flatMap((d) =>
        validSpans(content, d.spans).map((s) => ({ ...s, technique: d.name, why: str((s as Span).why) })),
      )
    : []
  const llmSpans = (field: string, text: string): Span[] =>
    (llm?.findings ?? [])
      .filter((f) => f.span.field === field)
      .flatMap((f) => {
        names.set(`llm:${f.label}`, `AI-assessed: ${f.name}`)
        return validSpans(text, [{ ...f.span, technique: `llm:${f.label}` }]).map((s) => ({ ...s, why: f.explanation }))
      })
  const contentSpans = [...spans, ...llmSpans('content', content)]
  const titleSpans = llmSpans('title', title)
  const spanCount = (name: string) => spans.filter((s) => s.technique === name).length
  const unavailable = techniques && techniques.spanStatus !== undefined && techniques.spanStatus !== 'ok'

  const marked = (field: string, text: string, all: Span[]) => {
    let pos = 0
    return segment(text, all).map((seg, i) => {
      const [a, key] = [pos, `${field}:${i}`]
      pos += seg.text.length
      if (seg.techniques.length === 0) return seg.text
      const whys = all.filter((s) => s.start <= a && a < s.end && s.why).map((s) => s.why as string)
      const open = () => setActive({ key, whys })
      return (
        <mark
          key={key}
          tabIndex={0}
          data-techniques={seg.techniques.join(' ')}
          data-llm={seg.techniques.every((t) => t.startsWith('llm:')) ? 'true' : undefined}
          data-selected={selected !== null && seg.techniques.includes(selected) ? 'true' : undefined}
          aria-label={`${seg.text} (${seg.techniques.map((t) => names.get(t) ?? t).join(', ')})`}
          aria-describedby={active?.key === key && whys.length > 0 ? 'job-why' : undefined}
          onFocus={open}
          onClick={open}
          onBlur={() => setActive((cur) => (cur?.key === key ? null : cur))}
          onKeyDown={(e) => e.key === 'Escape' && setActive(null)}
        >
          {seg.text}
        </mark>
      )
    })
  }

  return (
    <main className="job">
      <h1>Job result</h1>
      <p>Status: {job.status}</p>
      {title !== '' && (
        <p className="job-text job-title" data-testid="job-title">
          {marked('title', title, titleSpans)}
        </p>
      )}
      <div className="job-text" data-testid="job-text">
        {marked('content', content, contentSpans)}
      </div>
      {active && active.whys.length > 0 && (
        <div id="job-why" role="region" aria-label="Why this phrase is highlighted" className="job-why">
          <ul>
            {active.whys.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      <h2>Techniques</h2>
      {!techniques && <p>No technique analysis available.</p>}
      {techniques && (
        <>
          <p>Detections are indicators of a rhetorical technique, not proof that a text is propaganda.</p>
          {unavailable && <p role="note">Highlighting unavailable: exact phrases could not be located.</p>}
          {techniques.detected.length === 0 && <p>No technique detected.</p>}
          <ul className="job-techniques">
            {techniques.detected.map((d) => {
              const n = spanCount(d.name)
              const pl = plain(d)
              return (
                <li key={d.name}>
                  <button
                    type="button"
                    aria-pressed={selected === d.name}
                    onClick={() => setSelected(selected === d.name ? null : d.name)}
                  >
                    <strong className="job-technique-name">{names.get(d.name)}</strong>
                    <span className="job-technique-definition">{pl.definition ?? String(d.explanation ?? '')}</span>{' '}
                    <span>({n > 0 ? `${n} ${n === 1 ? 'phrase' : 'phrases'}` : 'no exact phrase found'})</span>
                  </button>
                  {n === 0 && pl.why && <p className="job-technique-why">{pl.why}</p>}
                </li>
              )
            })}
          </ul>
        </>
      )}
      {llm && (llm.unavailable || llm.findings.length > 0) && (
        <section>
          <h2>Other possible issues (AI-assessed, less reliable)</h2>
          {llm.unavailable && <p role="note">AI-assessed check not available</p>}
          {llm.findings.length > 0 && (
            <>
              <p>These findings come from a language model and are less reliable than the techniques above.</p>
              <ul className="job-llm">
                {llm.findings.map((f, i) => (
                  <li key={i}>
                    <strong>{f.name}</strong>
                    <p>{f.definition}</p>
                    <p>{f.explanation}</p>
                    {typeof f.span.text === 'string' && <blockquote>{f.span.text}</blockquote>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </main>
  )
}
