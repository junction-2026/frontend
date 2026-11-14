import type { Job } from '../api/types'
import { useT } from '../i18n'
import { readTermContext } from './read'
import { wikiHref } from './WikipediaLookup'

const obj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const text = (v: unknown) => (typeof v === 'string' ? v : '')

// "Term context links": an elsewhere url may be a link only for http or https.
function newsHref(url: unknown): string | null {
  try {
    const u = new URL(text(url))
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null
  } catch {
    return null
  }
}

function Source({ href, label }: { href: string | null; label: string }) {
  if (!label) return null
  return href ? <a href={href} target="_blank" rel="noopener noreferrer"><bdi dir="auto">{label}</bdi></a> : <bdi dir="auto">{label}</bdi>
}

function Card({ c }: { c: Record<string, unknown> }) {
  const t = useT()
  const enc = obj(c.encyclopedia) && text(c.encyclopedia.quote) !== '' ? c.encyclopedia : null // anything else reads as no_coverage
  const elsewhere = (Array.isArray(c.elsewhere) ? c.elsewhere : []).filter(obj).filter((e) => text(e.snippet) !== '')
  const sense = c.sense === 'same' || c.sense === 'differs' ? c.sense : 'unknown'
  // QuoteRefs that resolve to a shown quote; unresolvable ones are ignored.
  const refs = sense === 'differs' && Array.isArray(c.differs_from) ? c.differs_from.filter(obj) : []
  const encDiffers = !!enc && refs.some((r) => r.source === 'encyclopedia')
  const differs = (i: number) => refs.some((r) => r.source === 'elsewhere' && r.index === i)
  const marker = <span className="tag purple term-differs">{t('results.term.differs_marker')}</span>
  return (
    <li className="tech-item term-card" data-sense={sense}>
      <strong dir="auto">{text(c.term)}</strong>
      <div className="term-quote">
        <span className="term-label">{t('results.term.in_post')}</span>
        <p className="wiki-passage" dir="auto">{text(c.in_post)}</p>
      </div>
      <div className="term-quote" data-source="encyclopedia" data-differs={encDiffers || undefined}>
        <span className="term-label">{t('results.term.encyclopedia')}</span> {encDiffers && marker}
        {enc ? (
          <>
            <p className="wiki-passage" dir="auto">{text(enc.quote)}</p>
            <Source href={wikiHref(enc.url)} label={text(enc.title) || text(enc.url)} />
          </>
        ) : (
          <p className="tech-note">{t('results.term.no_coverage')}</p>
        )}
      </div>
      <div className="term-quote" data-source="elsewhere">
        <span className="term-label">{t('results.term.elsewhere')}</span>
        {elsewhere.length === 0 ? (
          <p className="tech-note">{t('results.term.no_elsewhere')}</p>
        ) : (
          <ul className="wiki-values">
            {elsewhere.map((e, i) => (
              <li key={i} data-differs={differs(i) || undefined}>
                {differs(i) && marker}
                <p className="wiki-passage" dir="auto">{text(e.snippet)}</p>
                <Source href={newsHref(e.url)} label={text(e.title) || text(e.domain) || text(e.url)} />
                {text(e.domain) && text(e.title) && <> · <bdi dir="auto">{text(e.domain)}</bdi></>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <span className={`tag ${sense === 'differs' ? 'purple' : 'gray'}`} data-sense-label={sense}>{t(`results.term.sense.${sense}`)}</span>
    </li>
  )
}

// Read-only term context section of the job view: one card per term with the post sentence, the encyclopedia lead and news
// snippets, each verbatim and as plain text. No verdict and no definition.
export function TermContext({ job }: { job: Job }) {
  const t = useT()
  const terms = readTermContext(job)
  if (terms === null) return null
  return (
    <section className="card tech-list term-context">
      <h3>{t('results.term.title')}</h3>
      {terms === undefined ? (
        <p className="tech-note">{t('results.term.unavailable')}</p>
      ) : terms.length === 0 ? (
        <p className="tech-note">{t('results.term.none')}</p>
      ) : (
        <>
          <p className="tech-note">{t('results.term.note')}</p>
          <ul className="wiki-claims">{terms.map((c, i) => <Card key={i} c={c} />)}</ul>
        </>
      )}
    </section>
  )
}
