import { useState } from 'react'
import type { Job } from '../api/types'
import { plain, readLlm, readTechniques, str, techniqueName, type Detection } from './read'
import { segment, validSpans, type Span } from './segments'
import './job.css'

type Active = { key: string; whys: string[] }

// The Detail body: highlighted text, technique list and the AI-assessed group of a loaded job.
export default function JobView({ job }: { job: Job }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [active, setActive] = useState<Active | null>(null)
  const content = typeof job.input?.content === 'string' ? job.input.content : ''
  const rawTitle = job.input?.source?.title
  const title = typeof rawTitle === 'string' && rawTitle.trim() !== '' ? rawTitle : ''
  const techniques = readTechniques(job)
  const llm = readLlm(job)
  const names = new Map<string, string>(techniques?.detected.map((d: Detection) => [d.name, techniqueName(d)]))
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

  const firstSpan = (name: string) => spans.find((s) => s.technique === name)
  return (
    <>
      <div className="soft-card excerpt-box">
        <div className="label">
          <span>Analyzed corpus excerpt</span>
          <span>Target Payload</span>
        </div>
        {title !== '' && (
          <p className="job-text job-title" data-testid="job-title">
            {marked('title', title, titleSpans)}
          </p>
        )}
        <div className="job-text" data-testid="job-text">
          {marked('content', content, contentSpans)}
        </div>
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
      <div className="card tech-list">
        <div className="tech-list-head">
          <div>
            <h3>Propaganda Techniques Detected</h3>
            {techniques && (
              <p>
                {techniques.detected.length} {techniques.detected.length === 1 ? 'technique' : 'techniques'} detected. Detections are
                indicators of a rhetorical technique, not proof that a text is propaganda.
              </p>
            )}
          </div>
        </div>
        {!techniques && <p className="tech-note">No technique analysis available.</p>}
        {unavailable && <p role="note" className="tech-note">Highlighting unavailable: exact phrases could not be located.</p>}
        {techniques && techniques.detected.length === 0 && <p className="tech-note">No technique detected.</p>}
        {techniques && (
          <ul className="job-techniques">
            {techniques.detected.map((d) => {
              const n = spanCount(d.name)
              const pl = plain(d)
              const anchor = firstSpan(d.name)
              return (
                <li key={d.name} className="tech-item">
                  <button
                    type="button"
                    aria-pressed={selected === d.name}
                    onClick={() => setSelected(selected === d.name ? null : d.name)}
                  >
                    <span className="tech-item-top">
                      <strong className="job-technique-name">{names.get(d.name)}</strong>
                      <span className="badge-soft">ID: {d.name}</span>
                    </span>
                    <span className="job-technique-definition">{pl.definition ?? String(d.explanation ?? '')}</span>{' '}
                    <span className="job-technique-count">({n > 0 ? `${n} ${n === 1 ? 'phrase' : 'phrases'}` : 'no exact phrase found'})</span>
                  </button>
                  {n === 0 && pl.why && <p className="job-technique-why">{pl.why}</p>}
                  {anchor && <div className="anchor">Excerpt anchor: “{anchor.text}”</div>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {llm && (llm.unavailable || llm.findings.length > 0) && (
        <section className="card tech-list job-llm-group">
          <h3>Other possible issues (AI-assessed, less reliable)</h3>
          {llm.unavailable && <p role="note" className="tech-note">AI-assessed check not available</p>}
          {llm.findings.length > 0 && (
            <>
              <p className="tech-note">These findings come from a language model and are less reliable than the techniques above.</p>
              <ul className="job-llm">
                {llm.findings.map((f, i) => (
                  <li key={i} className="tech-item">
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
    </>
  )
}
