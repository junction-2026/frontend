import { useMemo, useState, type ReactNode } from 'react'
import type { Job } from '../api/types'
import { rich, useLocale, useT } from '../i18n'
import { ErrorAlert, Skeleton } from '../job/WithJob'
import { useJob } from '../job/useJob'
import { Link } from '../router'
import { WorldMap } from '../secondary/WorldMap'
import { countryName, type Coverage } from '../secondary/worldMapData'
import '../job/results.css'
import '../secondary/secondary.css'
import { readExplore } from './adapter'
import { aggregateByCountry, filterItems, publisherCount, topicsOf } from './filters'
import type { ExploreData, ExploreItem, RunState } from './model'

type T = ReturnType<typeof useT>

function Head({ id, topics }: { id?: string; topics?: string[] }) {
  const t = useT()
  return (
    <div className="page-head">
      <div className="meta-row"><span>{t('explore.eyebrow')}</span></div>
      <h1>{t('explore.title')}</h1>
      <p>{t('explore.lede')}</p>
      {id && (
        <p className="explore-topics">
          {topics?.length ? <>{rich(t('explore.searched_topics'), { topics: <bdi>{topics.join(' · ')}</bdi> })} · </> : null}
          <Link href={`/jobs/${encodeURIComponent(id)}`}>{t('explore.back_to_analysis')}</Link>
        </p>
      )}
    </div>
  )
}

function Legend() {
  const t = useT()
  return (
    <div className="map-legend">
      <div className="legend-swatches">
        {t('explore.legend.density')}
        <span className="swatch"><i className="a" /> {t('explore.legend.none')}</span>
        <span className="swatch"><i className="b" /> {t('explore.legend.low')}</span>
        <span className="swatch"><i className="c" /> {t('explore.legend.medium')}</span>
        <span className="swatch"><i className="d" /> {t('explore.legend.high')}</span>
      </div>
      <em>{t('explore.legend.notice')}</em>
    </div>
  )
}

export function ExploreJob({ id }: { id: string }) {
  const [attempt, setAttempt] = useState(0) // a new key remounts the job request
  return <Loaded key={`${id}:${attempt}`} id={id} retry={() => setAttempt((a) => a + 1)} />
}

function Loaded({ id, retry }: { id: string; retry: () => void }) {
  const t = useT()
  const result = useJob(id)
  if (!result || !result.ok)
    return (
      <section className="view">
        <Head id={id} />
        {!result ? <Skeleton /> : (
          <>
            <ErrorAlert error={result.error} notFound={t('explore.job_not_found')} />
            {result.error.status !== 404 && <button type="button" className="btn-secondary" onClick={retry}>{t('explore.retry')}</button>}
          </>
        )}
      </section>
    )
  return <ExploreBody job={result.data} />
}

// One notice for the news search, null when there are articles to show.
function newsNotice(s: RunState, job: Job, data: ExploreData, t: T): ReactNode {
  if (s.status === 'missing') return t('explore.news.missing')
  if (s.status === 'pending' || s.status === 'running') return job.done ? t('explore.news.unfinished') : t('explore.news.searching')
  // The reason and the error code come from the API: a known reason is translated, any other is shown as sent.
  if (s.status === 'skipped') return s.reason ? rich(t('explore.news.skipped_reason'), { reason: s.reason === 'no_searchable_topics' ? t('explore.news.skip.no_searchable_topics') : <bdi>{s.reason}</bdi> }) : t('explore.news.skipped')
  if (s.status === 'failed') return s.error ? rich(t('explore.news.failed_code'), { code: <bdi>{s.error}</bdi> }) : t('explore.news.failed')
  return data.items.some((i) => i.kind === 'article') ? null : t('explore.news.no_articles')
}

function geoNotice(data: ExploreData, job: Job, t: T): string | null {
  if (data.newsStatus.status !== 'succeeded' || !data.items.some((i) => i.kind === 'article')) return null
  const s = data.geoStatus.status
  if (s === 'pending' || s === 'running') return job.done ? t('explore.geo.unavailable') : t('explore.geo.matching')
  return data.items.some((i) => i.countryCode) ? null : t('explore.geo.unavailable')
}

function ExploreBody({ job }: { job: Job }) {
  const t = useT()
  const data = useMemo(() => readExplore(job), [job])
  const [sel, setSel] = useState<string | null>(null)
  const topics = useMemo(() => topicsOf(data.queries), [data.queries])

  const filtered = filterItems(data.items, sel)
  const mapCoverage: Coverage = aggregateByCountry(data.items) // other countries stay shaded
  const stats = aggregateByCountry(filtered)
  const factOk = data.factStatus.status === 'succeeded' && data.items.some((i) => i.kind === 'fact_check')
  const notice = newsNotice(data.newsStatus, job, data, t)
  const geo = geoNotice(data, job, t)
  const none = data.newsStatus.status !== 'succeeded' && !factOk
  const unknown = filtered.filter((i) => i.kind === 'article' && !i.countryCode).length
  const countryCount = Object.keys(stats).length
  const subtitle = countryCount
    ? t('explore.subtitle', { publishers: t('explore.publisher', { count: publisherCount(filtered.filter((i) => i.countryCode)) }), countries: t('explore.country', { count: countryCount }) })
    : t('explore.subtitle_none')

  return (
    <section className="view">
      <Head id={job.id} topics={topics} />
      {job.status === 'failed' && <p role="status" className="explore-note">{t('explore.job_failed')}</p>}
      {job.status === 'cancelled' && <p role="status" className="explore-note">{t('explore.job_cancelled')}</p>}

      {notice && <p role="status" className="explore-note">{notice}</p>}
      {geo && <p role="status" className="explore-note">{geo}</p>}

      <div className="card map-card">
        <div className="map-card-head">
          <div>
            <h2>{t('explore.map_title')}</h2>
            <p>{unknown > 0 ? t('explore.subtitle_unknown', { subtitle, articles: t('explore.article', { count: unknown }) }) : subtitle}</p>
          </div>
        </div>
        <WorldMap coverage={mapCoverage} selected={sel} onSelect={setSel} />
        {sel && <CountryPanel code={sel} stats={stats} items={filtered} onClear={() => setSel(null)} />}
        <Legend />
      </div>

      {!none && data.items.length > 0 && <Related items={filtered} coverage={mapCoverage} />}
    </section>
  )
}

function CountryPanel({ code, stats, items, onClear }: { code: string; stats: Coverage; items: ExploreItem[]; onClear: () => void }) {
  const t = useT()
  const { locale } = useLocale()
  const info = stats[code]
  const name = countryName(code, stats, locale)
  return (
    <div className="country-panel">
      <strong>{name}</strong>
      {info ? (
        <>
          <span>{t('explore.map.tooltip_counts', { articles: t('explore.article', { count: info.articles }), publishers: t('explore.publisher', { count: info.publishers }) })}</span>
          <span>{info.languages?.length ? rich(t('explore.panel.languages'), { languages: <bdi>{info.languages.map((l) => l.toUpperCase()).join(', ')}</bdi> }) : t('explore.panel.languages', { languages: t('explore.panel.languages_unknown') })}</span>
          <ul className="country-headlines">
            {items.slice(0, 5).map((i) => <li key={i.id}><bdi>{i.title}</bdi>{' — '}<bdi>{[i.publisher, i.date].filter(Boolean).join(' · ')}</bdi></li>)}
          </ul>
        </>
      ) : (
        <span>{t('explore.panel.no_data', { name })}</span>
      )}
      <div className="country-panel-actions">
        <button type="button" className="btn-link" onClick={onClear}>{t('explore.panel.clear')}</button>
        <Link href="/explore/region">{t('explore.panel.inspect')}</Link>
      </div>
    </div>
  )
}

function Related({ items, coverage }: { items: ExploreItem[]; coverage: Coverage }) {
  const t = useT()
  const { locale } = useLocale()
  return (
    <div className="card related">
      <div className="map-card-head">
        <div>
          <h2>{t('explore.related.title')}</h2>
          <p>{t('explore.related.counts', { items: t('explore.article', { count: items.length }), publishers: t('explore.publisher', { count: publisherCount(items) }) })}</p>
        </div>
      </div>
      {items.length === 0 ? <p className="explore-note">{t('explore.related.none')}</p> : (
        <ul className="related-list">
          {items.map((i) => (
            <li key={`${i.kind}:${i.id}`} className="related-card">
              <a href={i.url} target="_blank" rel="noopener noreferrer" dir="auto">{i.title}</a>
              <div className="related-meta">
                {i.publisher && <span><bdi>{i.publisher}</bdi></span>}
                {i.date && <span><bdi>{i.date}</bdi></span>}
                {i.language && <span><bdi>{i.language.toUpperCase()}</bdi></span>}
                {i.rating && <span className="tag orange"><bdi>{i.rating}</bdi></span>}
                {i.kind === 'article' && (i.countryCode ? <span className="tag green">{countryName(i.countryCode, coverage, locale)}</span> : <span className="tag gray">{t('explore.related.country_unknown')}</span>)}
              </div>
              {i.kind === 'fact_check' && <ClaimLines item={i} />}
              {i.snippet && <p dir="auto">{i.snippet}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// A match is a similar checked claim (fact-check-result): only an equal claim may be called a check of the extracted one.
function ClaimLines({ item: { forClaim, checkedClaim } }: { item: ExploreItem }) {
  const t = useT()
  const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()
  if (forClaim && checkedClaim && same(forClaim, checkedClaim)) return <p>{rich(t('explore.claim.same'), { claim: <bdi>{forClaim}</bdi> })}</p>
  return (
    <>
      {checkedClaim && <p>{rich(t('explore.claim.similar'), { claim: <bdi>{checkedClaim}</bdi> })}</p>}
      {forClaim && <p>{rich(t('explore.claim.found_for'), { claim: <bdi>{forClaim}</bdi> })}</p>}
    </>
  )
}
