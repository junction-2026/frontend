import { useMemo, useState, type ReactNode } from 'react'
import type { Job } from '../api/types'
import { rich, useLocale, useT } from '../i18n'
import { ErrorAlert, Skeleton } from '../job/WithJob'
import { useJob } from '../job/useJob'
import { Link } from '../router'
import { WorldMap } from '../secondary/WorldMap'
import { SELECTABLE, countryName, type Coverage } from '../secondary/worldMapData'
import '../job/results.css'
import '../secondary/secondary.css'
import { readExplore } from './adapter'
import { aggregateByCountry, filterItems, options, publisherCount, topicsOf } from './filters'
import { NO_FILTERS, type ExploreData, type ExploreItem, type Filters, type RunState } from './model'

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

// Without a job: head, disabled filters and an empty map; no request is made.
export function ExploreEmpty() {
  const t = useT()
  return (
    <section className="view">
      <Head />
      <div className="filters" aria-label={t('explore.filters')}>
        <label className="field"><span aria-hidden="true" className="mirror-rtl">⌕</span><input aria-label={t('explore.search_aria')} disabled placeholder={t('explore.search_placeholder')} /></label>
        {['topic', 'country', 'languages', 'publishers'].map((n) => <button key={n} type="button" className="field" disabled>{t('explore.filter.no_data', { label: t(`explore.filter.${n}`) })}</button>)}
        <span className="verified-chip">{t('explore.verified_only')}</span>
      </div>
      <div className="card map-card">
        <div className="map-card-head"><div><h2>{t('explore.map_title')}</h2><p>{t('explore.no_job')}</p></div></div>
        <WorldMap coverage={{}} selected={null} interactive={false} />
        <p className="explore-note"><Link href="/history">{t('explore.open_history')}</Link></p>
        <Legend />
      </div>
    </section>
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

function Multi({ label, opts, value, onChange }: { label: string; opts: ReturnType<typeof options>; value: string[]; onChange: (v: string[]) => void }) {
  const t = useT()
  if (!opts.length) return <button type="button" className="field" disabled>{t('explore.filter.no_data', { label })}</button>
  return (
    <details className="field multi">
      <summary>{t('explore.filter.value', { label, value: value.length ? value.length : t('explore.filter.all') })} <span aria-hidden="true">▾</span></summary>
      <div className="multi-list">
        {opts.map((o) => (
          <label key={o.value}>
            <input
              type="checkbox"
              checked={value.includes(o.value)}
              onChange={(e) => onChange(e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value))}
            />
            <bdi>{o.label}</bdi> ({o.count})
          </label>
        ))}
      </div>
    </details>
  )
}

function ExploreBody({ job }: { job: Job }) {
  const t = useT()
  const { locale } = useLocale()
  const data = useMemo(() => readExplore(job), [job])
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }))
  const topics = useMemo(() => topicsOf(data.queries), [data.queries])

  const filtered = filterItems(data.items, filters)
  const shaded = filterItems(data.items, { ...filters, country: null }) // other countries stay shaded
  const mapCoverage: Coverage = aggregateByCountry(shaded)
  const stats = aggregateByCountry(filtered)
  const sel = filters.country
  const base = data.items.filter((i) => (i.kind === 'fact_check') === filters.verifiedOnly)
  const factOk = data.factStatus.status === 'succeeded' && data.items.some((i) => i.kind === 'fact_check')
  const notice = newsNotice(data.newsStatus, job, data, t)
  const geo = geoNotice(data, job, t)
  const none = data.newsStatus.status !== 'succeeded' && !factOk
  const unknown = filtered.filter((i) => i.kind === 'article' && !i.countryCode).length
  const countryCount = Object.keys(stats).length
  const subtitle = countryCount
    ? t('explore.subtitle', { publishers: t('explore.publisher', { count: publisherCount(filtered.filter((i) => i.countryCode)) }), countries: t('explore.country', { count: countryCount }) })
    : t('explore.subtitle_none')
  const countryOptions = SELECTABLE.map((c) => ({ code: c.code, name: countryName(c.code, mapCoverage, locale) })).sort((a, b) => a.name.localeCompare(b.name, locale))

  return (
    <section className="view">
      <Head id={job.id} topics={topics} />
      {job.status === 'failed' && <p role="status" className="explore-note">{t('explore.job_failed')}</p>}
      {job.status === 'cancelled' && <p role="status" className="explore-note">{t('explore.job_cancelled')}</p>}

      <div className="filters" aria-label={t('explore.filters')}>
        <label className="field">
          <span aria-hidden="true" className="mirror-rtl">⌕</span>
          <input aria-label={t('explore.search_aria')} placeholder={t('explore.search_placeholder')} value={filters.text} disabled={none} onChange={(e) => set({ text: e.target.value })} />
        </label>
        <span className="field">
          <select dir="auto" aria-label={t('explore.filter.topic')} value={filters.topic ?? ''} disabled={!topics.length} onChange={(e) => set({ topic: e.target.value || null })}>
            <option value="">{topics.length ? t('explore.all_topics') : t('explore.no_data')}</option>
            {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
          </select>
        </span>
        <span className="field">
          <select aria-label={t('explore.filter.country')} value={sel ?? ''} onChange={(e) => set({ country: e.target.value || null })}>
            <option value="">{t('explore.all_regions')}</option>
            {countryOptions.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          {sel && <button type="button" className="field-clear" aria-label={t('explore.clear_country')} onClick={() => set({ country: null })}>×</button>}
        </span>
        <Multi label={t('explore.filter.languages')} opts={options(base, 'language')} value={filters.languages} onChange={(languages) => set({ languages })} />
        <Multi label={t('explore.filter.publishers')} opts={options(base, 'publisher')} value={filters.publishers} onChange={(publishers) => set({ publishers })} />
        <label className="verified-chip" title={factOk ? undefined : t('explore.no_fact_checks')}>
          <input type="checkbox" checked={filters.verifiedOnly} disabled={!factOk} onChange={(e) => set({ verifiedOnly: e.target.checked })} />
          {' '}{t('explore.verified_only')}
        </label>
      </div>

      {notice && <p role="status" className="explore-note">{notice}</p>}
      {geo && <p role="status" className="explore-note">{geo}</p>}

      <div className="card map-card">
        <div className="map-card-head">
          <div>
            <h2>{t('explore.map_title')}</h2>
            <p>{unknown > 0 ? t('explore.subtitle_unknown', { subtitle, articles: t('explore.article', { count: unknown }) }) : subtitle}</p>
          </div>
        </div>
        <WorldMap coverage={mapCoverage} selected={sel} onSelect={(country) => set({ country })} />
        {sel && <CountryPanel code={sel} stats={stats} items={filtered} onClear={() => set({ country: null })} />}
        <Legend />
      </div>

      {!none && base.length > 0 && <Related items={filtered} verified={filters.verifiedOnly} coverage={mapCoverage} />}
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

function Related({ items, verified, coverage }: { items: ExploreItem[]; verified: boolean; coverage: Coverage }) {
  const t = useT()
  const { locale } = useLocale()
  const noun = verified ? 'explore.fact_check' : 'explore.article'
  return (
    <div className="card related">
      <div className="map-card-head">
        <div>
          <h2>{t('explore.related.title')}</h2>
          <p>{t('explore.related.counts', { items: t(noun, { count: items.length }), publishers: t('explore.publisher', { count: publisherCount(items) }) })}</p>
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
