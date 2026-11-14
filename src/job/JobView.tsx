import { useState } from 'react'
import type { Job } from '../api/types'
import { useFormat, useLocale, useT } from '../i18n'
import { findingEntry, useLoc, useLocalizedText } from './localize'
import { plain, readLlm, readTechniques, str, techniqueInfo, techniqueText, whyText, type Finding } from './read'
import { segment, validSpans, type Span } from './segments'
import './job.css'

type Why = { text: string; finding?: Finding } // finding: an LLM explanation, which can be machine-translated
type WSpan = Span & { finding?: Finding }
type Active = { key: string; whys: Why[] }

// The why of an LLM highlight: the explanation with the same marker and toggle as in the findings list.
function LlmWhy({ f }: { f: Finding }) {
  const { text, note } = useLocalizedText(f.explanation, findingEntry(useLoc(), f.index, f.label))
  return <li dir="auto">{text}{note}</li>
}

// One LLM finding: name and definition (catalog by label), explanation from the localization with its marker,
// the quoted span text verbatim.
function LlmFinding({ f, name, definition }: { f: Finding; name: string; definition: string }) {
  const { text, note } = useLocalizedText(f.explanation, findingEntry(useLoc(), f.index, f.label))
  return (
    <li className="tech-item">
      <strong>{name}</strong>
      <p>{definition}</p>
      <p dir="auto">{text}</p>
      {note}
      {typeof f.span.text === 'string' && <blockquote><bdi dir="auto">{f.span.text}</bdi></blockquote>}
    </li>
  )
}

// The Detail body: highlighted text, technique list and the AI-assessed group of a loaded job.
export default function JobView({ job }: { job: Job }) {
  const t = useT()
  const { locale } = useLocale()
  const { formatNumber: fmt } = useFormat()
  const [selected, setSelected] = useState<string | null>(null)
  const [active, setActive] = useState<Active | null>(null)
  const content = typeof job.input?.content === 'string' ? job.input.content : ''
  const rawTitle = job.input?.source?.title
  const title = typeof rawTitle === 'string' && rawTitle.trim() !== '' ? rawTitle : ''
  const techniques = readTechniques(job)
  const llm = readLlm(job)
  const infos = new Map((techniques?.detected ?? []).map((d) => [d.name, techniqueInfo(d, locale, techniques?.lang)]))
  const names = new Map<string, string>([...infos].map(([id, i]) => [id, i.name]))
  const spans: Span[] = techniques
    ? techniques.detected.flatMap((d) =>
        validSpans(content, d.spans).map((s) => ({ ...s, technique: d.name, why: whyText(infos.get(d.name)!, locale, str((s as Span).why), s.text) })),
      )
    : []
  const llmText = (f: Finding) => techniqueText(f.label, locale, llm?.lang ?? locale, { name: f.name, definition: f.definition })
  const llmSpans = (field: string, text: string): WSpan[] =>
    (llm?.findings ?? [])
      .filter((f) => f.span.field === field)
      .flatMap((f) => {
        names.set(`llm:${f.label}`, `${t('results.jobview.ai_prefix')} ${llmText(f).name}`)
        return validSpans(text, [{ ...f.span, technique: `llm:${f.label}` }]).map((s) => ({ ...s, why: f.explanation, finding: f }))
      })
  const contentSpans = [...spans, ...llmSpans('content', content)]
  const titleSpans = llmSpans('title', title)
  const spanCount = (name: string) => spans.filter((s) => s.technique === name).length
  const unavailable = techniques && techniques.spanStatus !== undefined && techniques.spanStatus !== 'ok'

  const marked = (field: string, text: string, all: WSpan[]) => {
    let pos = 0
    return segment(text, all).map((seg, i) => {
      const [a, key] = [pos, `${field}:${i}`]
      pos += seg.text.length
      if (seg.techniques.length === 0) return seg.text
      const whys = all.filter((s) => s.start <= a && a < s.end && s.why).map((s) => ({ text: s.why as string, finding: s.finding }))
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
          onBlur={(e) => !(e.relatedTarget as Element | null)?.closest?.('#job-why') && setActive((cur) => (cur?.key === key ? null : cur))} // moving into the region (its toggle) keeps it open
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
          <span>{t('results.jobview.corpus')}</span>
          <span>{t('results.jobview.payload')}</span>
        </div>
        {title !== '' && (
          <p className="job-text job-title" data-testid="job-title" dir="auto">
            {marked('title', title, titleSpans)}
          </p>
        )}
        <div className="job-text" data-testid="job-text" dir="auto">
          {marked('content', content, contentSpans)}
        </div>
      </div>
      {active && active.whys.length > 0 && (
        <div id="job-why" role="region" aria-label={t('results.jobview.why_region')} className="job-why">
          <ul>
            {active.whys.map((w, i) => (
              w.finding ? <LlmWhy key={i} f={w.finding} /> : <li key={i} dir="auto">{w.text}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="card tech-list">
        <div className="tech-list-head">
          <div>
            <h3>{t('results.jobview.techniques')}</h3>
            {techniques && (
              <p>{t('results.jobview.techniques_count', { count: techniques.detected.length, n: fmt(techniques.detected.length) })}</p>
            )}
          </div>
        </div>
        {!techniques && <p className="tech-note">{t('results.jobview.no_analysis')}</p>}
        {unavailable && <p role="note" className="tech-note">{t('results.jobview.highlight_unavailable')}</p>}
        {techniques && techniques.detected.length === 0 && <p className="tech-note">{t('results.jobview.none')}</p>}
        {techniques && (
          <ul className="job-techniques">
            {techniques.detected.map((d) => {
              const n = spanCount(d.name)
              const pl = plain(d)
              const info = infos.get(d.name)!
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
                      <span className="badge-soft">{t('results.jobview.id')} {d.name}</span>
                      {(d.strength === 'strong' || d.strength === 'weak') && <span className="badge-soft">{t(`results.jobview.strength.${d.strength}`)}</span>}
                    </span>
                    <span className="job-technique-definition">{info.definition}</span>{' '}
                    <span className="job-technique-count">{n > 0 ? t('results.jobview.phrases', { count: n, n: fmt(n) }) : t('results.jobview.no_phrase')}</span>
                  </button>
                  {n === 0 && pl.why && <p className="job-technique-why">{whyText(info, locale, pl.why)}</p>}
                  {anchor && <div className="anchor">{t('results.jobview.anchor')} “<bdi dir="auto">{anchor.text}</bdi>”</div>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {llm && (llm.unavailable || llm.findings.length > 0) && (
        <section className="card tech-list job-llm-group">
          <h3>{t('results.jobview.llm_title')}</h3>
          {llm.unavailable && <p role="note" className="tech-note">{t('results.jobview.llm_unavailable')}</p>}
          {llm.findings.length > 0 && (
            <>
              <p className="tech-note">{t('results.jobview.llm_note')}</p>
              <ul className="job-llm">
                {llm.findings.map((f) => <LlmFinding key={f.index} f={f} name={llmText(f).name} definition={llmText(f).definition} />)}
              </ul>
            </>
          )}
        </section>
      )}
    </>
  )
}
