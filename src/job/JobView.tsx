import { useState } from 'react'
import type { Detection, Job } from './api'
import { segment, validSpans, type Span } from './segments'
import { useJob } from './useJob'
import './job.css'

type Techniques = { detected: Detection[]; spanStatus: unknown }

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

export default function JobView({ id }: { id: string }) {
  const result = useJob(id)
  if (!result) return <p role="status">Loading…</p>
  if (!result.ok) return <p role="alert">{result.message}</p>
  return <Result job={result.job} />
}

function Result({ job }: { job: Job }) {
  const [selected, setSelected] = useState<string | null>(null)
  const content = typeof job.input?.content === 'string' ? job.input.content : ''
  const techniques = readTechniques(job)
  const display = new Map(techniques?.detected.map((d) => [d.name, String(d.display ?? d.name)]))
  const spans: Span[] = techniques
    ? techniques.detected.flatMap((d) => validSpans(content, d.spans).map((s) => ({ ...s, technique: d.name })))
    : []
  const spanCount = (name: string) => spans.filter((s) => s.technique === name).length
  const unavailable = techniques && techniques.spanStatus !== undefined && techniques.spanStatus !== 'ok'

  return (
    <main className="job">
      <h1>Job result</h1>
      <p>Status: {job.status}</p>
      <div className="job-text" data-testid="job-text">
        {segment(content, spans).map((seg, i) =>
          seg.techniques.length === 0 ? (
            seg.text
          ) : (
            <mark
              key={i}
              data-techniques={seg.techniques.join(' ')}
              data-selected={selected !== null && seg.techniques.includes(selected) ? 'true' : undefined}
              aria-label={`${seg.text} (${seg.techniques.map((t) => display.get(t) ?? t).join(', ')})`}
            >
              {seg.text}
            </mark>
          ),
        )}
      </div>
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
              return (
                <li key={d.name}>
                  <button
                    type="button"
                    aria-pressed={selected === d.name}
                    onClick={() => setSelected(selected === d.name ? null : d.name)}
                  >
                    <strong>{display.get(d.name)}</strong>: {String(d.explanation ?? '')}{' '}
                    <span>({n > 0 ? `${n} ${n === 1 ? 'phrase' : 'phrases'}` : 'no exact phrase found'})</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </main>
  )
}
