import type { ClaimLookup, CrossLanguageDifference, Job, WikiLookup, WikipediaLookup as Result } from '../api/types'
import { useLocale, useT } from '../i18n'
import { languageName } from './localize'
import { run } from './read'

const COVERAGE = ['no_coverage', 'mentioned', 'aligned', 'conflicts']
const obj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const text = (v: unknown) => (typeof v === 'string' ? v : '')

// shared "Wikipedia result rendering": a link only for an absolute https URL on *.wikipedia.org; anything else stays text.
export function wikiHref(url: unknown): string | null {
  try {
    const u = new URL(text(url))
    return u.protocol === 'https:' && u.hostname.endsWith('.wikipedia.org') ? u.href : null
  } catch {
    return null
  }
}

// null while the run is pending or running; undefined when it is missing, skipped, failed or has no usable result.
function read(job: Job): Result | undefined | null {
  const r = run(job, 'wikipedia')
  if (r?.status === 'pending' || r?.status === 'running') return null
  const res = r?.result
  if (r?.status !== 'succeeded' || !obj(res) || !Array.isArray(res.claims)) return undefined
  return res as Result
}

function Link({ url, label }: { url: unknown; label: string }) {
  const href = wikiHref(url)
  const shown = label || text(url)
  if (!shown) return null
  return href ? <a href={href} target="_blank" rel="noopener noreferrer"><bdi dir="auto">{shown}</bdi></a> : <bdi dir="auto">{shown}</bdi>
}

function Edition({ w }: { w: WikiLookup }) {
  const t = useT()
  const { locale } = useLocale()
  const found = w.status === 'found' && typeof w.passage === 'string' && w.passage !== '' // any other status reads like no_page
  const cov = COVERAGE.includes(w.coverage as string) ? (w.coverage as string) : 'no_coverage'
  const evidence = (cov === 'aligned' || cov === 'conflicts') && text(w.evidence_sentence)
  return (
    <li className="wiki-edition" data-language={text(w.language)}>
      <div className="wiki-edition-head">
        <strong>{t('results.wiki.edition', { language: languageName(text(w.language), locale) })}</strong>
        {found && <Link url={w.url} label={text(w.title)} />}
      </div>
      {found ? (
        <>
          <p className="wiki-passage" dir="auto">{w.passage}</p>
          <span className={`tag wiki-coverage ${cov === 'conflicts' ? 'orange' : 'gray'}`} data-coverage={cov}>{t(`results.wiki.coverage.${cov}`)}</span>
          {evidence && <p className="wiki-evidence" dir="auto">{evidence}</p>}
        </>
      ) : (
        <p className="tech-note">{t('results.wiki.no_page')}</p>
      )}
    </li>
  )
}

function Difference({ d, wikis }: { d: CrossLanguageDifference; wikis: WikiLookup[] }) {
  const t = useT()
  const { locale } = useLocale()
  const title = text(wikis.find((w) => w.language === d.language)?.title)
  const values = (Array.isArray(d.values) ? d.values : []).filter(obj)
  return (
    <li>
      <strong>{t('results.wiki.edition', { language: languageName(text(d.language), locale) })}</strong> <Link url={d.url} label={title} />
      {values.length === 0 ? (
        <p className="tech-note">{t('results.wiki.cross.no_values')}</p>
      ) : (
        <ul className="wiki-values">
          {values.map((v, i) => <li key={i}>“<bdi dir="auto">{text(v.text)}</bdi>”</li>)}
        </ul>
      )}
    </li>
  )
}

// agree and gap are neutral notes; discrepancy quotes each edition's differing values. null, missing or unknown: nothing.
function CrossLanguage({ c }: { c: ClaimLookup }) {
  const t = useT()
  const state = c.cross_language
  if (state === 'agree' || state === 'gap') return <p role="note" className={`wiki-cross wiki-cross-${state}`} data-cross={state}>{t(`results.wiki.cross.${state}`)}</p>
  if (state !== 'discrepancy') return null
  const diffs = Array.isArray(c.cross_language_differences) ? c.cross_language_differences.filter(obj) : []
  return (
    <div role="note" className="wiki-cross wiki-cross-discrepancy" data-cross="discrepancy">
      <p>{t('results.wiki.cross.discrepancy')}</p>
      {diffs.length > 0 && <ul>{diffs.map((d, i) => <Difference key={i} d={d} wikis={wikisOf(c)} />)}</ul>}
    </div>
  )
}

const wikisOf = (c: ClaimLookup): WikiLookup[] => (Array.isArray(c.wikis) ? c.wikis.filter(obj) : [])

// Read-only Wikipedia section of the job view: per claim each edition's passage verbatim and apart, its coverage label and
// the cross-language state. No verdict, no merged passage, no counts.
export function WikipediaLookup({ job }: { job: Job }) {
  const t = useT()
  const res = read(job)
  if (res === null) return null
  return (
    <section className="card tech-list wiki-lookup">
      <h3>{t('results.wiki.title')}</h3>
      {res === undefined ? (
        <p className="tech-note">{t('results.wiki.unavailable')}</p>
      ) : (
        <>
          <p className="tech-note">{t('results.wiki.note')}</p>
          <ul className="wiki-claims">
            {res.claims.filter(obj).map((c, i) => (
              <li key={i} className="tech-item wiki-claim">
                <strong dir="auto">{text(c.claim)}</strong>
                <ul className="wiki-editions">{wikisOf(c).map((w, j) => <Edition key={j} w={w} />)}</ul>
                <CrossLanguage c={c} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
