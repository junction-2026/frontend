import { useMemo, useState, type ReactNode } from 'react'
import type { Job } from '../api/types'
import { ErrorAlert, Skeleton } from '../job/WithJob'
import { useJob } from '../job/useJob'
import { Link } from '../router'
import { WorldMap } from '../secondary/WorldMap'
import { SELECTABLE, countryName, plural, type Coverage } from '../secondary/worldMapData'
import '../job/results.css'
import '../secondary/secondary.css'
import { readExplore } from './adapter'
import { aggregateByCountry, filterItems, options, publisherCount, topicsOf } from './filters'
import { NO_FILTERS, type ExploreData, type ExploreItem, type Filters, type RunState } from './model'

const NO_JOB = 'Open Explore coverage from a completed analysis to see where its stories were published.'
const SKIP_REASONS: Record<string, string> = { no_searchable_topics: 'no searchable topics were found in the text' }
const countries = (n: number) => `${n} ${n === 1 ? 'country' : 'countries'}`

function Head({ id, topics }: { id?: string; topics?: string[] }) {
  return (
    <div className="page-head">
      <div className="meta-row"><span>● Topic inquest · Cross-border media topology</span></div>
      <h1>Explore the world.</h1>
      <p>Discover how stories are covered across sources and regions. Coverage density reflects verified publisher bureaus, not state responsibility.</p>
      {id && (
        <p className="explore-topics">
          {topics?.length ? <>Searched topics: {topics.join(' · ')} · </> : null}
          <Link href={`/jobs/${encodeURIComponent(id)}`}>Back to analysis →</Link>
        </p>
      )}
    </div>
  )
}

function Legend() {
  return (
    <div className="map-legend">
      <div className="legend-swatches">
        Coverage density:
        <span className="swatch"><i className="a" /> None</span>
        <span className="swatch"><i className="b" /> Low</span>
        <span className="swatch"><i className="c" /> Medium</span>
        <span className="swatch"><i className="d" /> High</span>
      </div>
      <em>Notice: Geographic indicators represent verified publisher operational bureaus, not state responsibility.</em>
    </div>
  )
}

// Without a job: head, disabled filters and an empty map; no request is made.
export function ExploreEmpty() {
  return (
    <section className="view">
      <Head />
      <div className="filters" aria-label="Explore filters">
        <label className="field"><span aria-hidden="true">⌕</span><input aria-label="Search topic text" disabled placeholder="Search titles and snippets" /></label>
        {['Topic', 'Country', 'Languages', 'Publishers'].map((n) => <button key={n} type="button" className="field" disabled>{n}: No data</button>)}
        <span className="verified-chip">Verified fact-checks only</span>
      </div>
      <div className="card map-card">
        <div className="map-card-head"><div><h2>Geographic Coverage &amp; Publisher Distribution</h2><p>{NO_JOB}</p></div></div>
        <WorldMap coverage={{}} selected={null} interactive={false} />
        <p className="explore-note"><Link href="/history">Open History →</Link></p>
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
  const result = useJob(id)
  if (!result || !result.ok)
    return (
      <section className="view">
        <Head id={id} />
        {!result ? <Skeleton /> : (
          <>
            <ErrorAlert error={result.error} notFound="Job not found" />
            {result.error.status !== 404 && <button type="button" className="btn-secondary" onClick={retry}>Retry</button>}
          </>
        )}
      </section>
    )
  return <ExploreBody job={result.data} />
}

// One notice for the news search, null when there are articles to show.
function newsNotice(s: RunState, job: Job, data: ExploreData): ReactNode {
  if (s.status === 'missing') return 'Coverage search is not available for this analysis'
  if (s.status === 'pending' || s.status === 'running')
    return job.done ? 'Coverage search did not finish for this analysis' : 'Searching news coverage…'
  if (s.status === 'skipped') return `Coverage search was skipped${s.reason ? `: ${SKIP_REASONS[s.reason] ?? s.reason}` : ''}`
  if (s.status === 'failed') return `Coverage search failed${s.error ? ` (error code: ${s.error})` : ''}`
  return data.items.some((i) => i.kind === 'article') ? null : 'No related articles were found. This is not evidence that a claim is false.'
}

function geoNotice(data: ExploreData, job: Job): string | null {
  if (data.newsStatus.status !== 'succeeded' || !data.items.some((i) => i.kind === 'article')) return null
  const s = data.geoStatus.status
  if (s === 'pending' || s === 'running') return job.done ? 'Geographic data unavailable for this analysis' : 'Matching publishers…'
  return data.items.some((i) => i.countryCode) ? null : 'Geographic data unavailable for this analysis'
}

function Multi({ label, opts, value, onChange }: { label: string; opts: ReturnType<typeof options>; value: string[]; onChange: (v: string[]) => void }) {
  if (!opts.length) return <button type="button" className="field" disabled>{label}: No data</button>
  return (
    <details className="field multi">
      <summary>{label}: {value.length ? value.length : 'All'} ▾</summary>
      <div className="multi-list">
        {opts.map((o) => (
          <label key={o.value}>
            <input
              type="checkbox"
              checked={value.includes(o.value)}
              onChange={(e) => onChange(e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value))}
            />
            {o.label} ({o.count})
          </label>
        ))}
      </div>
    </details>
  )
}

function ExploreBody({ job }: { job: Job }) {
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
  const notice = newsNotice(data.newsStatus, job, data)
  const geo = geoNotice(data, job)
  const none = data.newsStatus.status !== 'succeeded' && !factOk
  const unknown = filtered.filter((i) => i.kind === 'article' && !i.countryCode).length
  const countryCount = Object.keys(stats).length
  const subtitle = countryCount
    ? `${plural(publisherCount(filtered.filter((i) => i.countryCode)), 'publisher')} across ${countries(countryCount)}`
    : 'No verified publisher-country data yet'

  return (
    <section className="view">
      <Head id={job.id} topics={topics} />
      {job.status === 'failed' && <p role="status" className="explore-note">This analysis failed; showing the results that exist.</p>}
      {job.status === 'cancelled' && <p role="status" className="explore-note">This analysis was cancelled; showing the results that exist.</p>}

      <div className="filters" aria-label="Explore filters">
        <label className="field">
          <span aria-hidden="true">⌕</span>
          <input aria-label="Search topic text" placeholder="Search titles and snippets" value={filters.text} disabled={none} onChange={(e) => set({ text: e.target.value })} />
        </label>
        <span className="field">
          <select aria-label="Topic" value={filters.topic ?? ''} disabled={!topics.length} onChange={(e) => set({ topic: e.target.value || null })}>
            <option value="">{topics.length ? 'All topics' : 'No data'}</option>
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </span>
        <span className="field">
          <select aria-label="Country" value={sel ?? ''} onChange={(e) => set({ country: e.target.value || null })}>
            <option value="">All regions</option>
            {SELECTABLE.map((c) => <option key={c.code} value={c.code}>{countryName(c.code, mapCoverage)}</option>)}
          </select>
          {sel && <button type="button" className="field-clear" aria-label="Clear country" onClick={() => set({ country: null })}>×</button>}
        </span>
        <Multi label="Languages" opts={options(base, 'language')} value={filters.languages} onChange={(languages) => set({ languages })} />
        <Multi label="Publishers" opts={options(base, 'publisher')} value={filters.publishers} onChange={(publishers) => set({ publishers })} />
        <label className="verified-chip" title={factOk ? undefined : 'No fact-checks were found for this analysis'}>
          <input type="checkbox" checked={filters.verifiedOnly} disabled={!factOk} onChange={(e) => set({ verifiedOnly: e.target.checked })} />
          {' '}Verified fact-checks only
        </label>
      </div>

      {notice && <p role="status" className="explore-note">{notice}</p>}
      {geo && <p role="status" className="explore-note">{geo}</p>}

      <div className="card map-card">
        <div className="map-card-head">
          <div>
            <h2>Geographic Coverage &amp; Publisher Distribution</h2>
            <p>{subtitle}{unknown > 0 ? ` · ${plural(unknown, 'article')} with country unknown` : ''}</p>
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
  const info = stats[code]
  const name = countryName(code, stats)
  return (
    <div className="country-panel">
      <strong>{name}</strong>
      {info ? (
        <>
          <span>{plural(info.articles, 'article')} · {plural(info.publishers, 'publisher')}</span>
          <span>Languages: {info.languages?.length ? info.languages.map((l) => l.toUpperCase()).join(', ') : 'unknown'}</span>
          <ul className="country-headlines">
            {items.slice(0, 5).map((i) => <li key={i.id}>{i.title}{' — '}{[i.publisher, i.date].filter(Boolean).join(' · ')}</li>)}
          </ul>
        </>
      ) : (
        <span>No verified publisher data for {name}</span>
      )}
      <div className="country-panel-actions">
        <button type="button" className="btn-link" onClick={onClear}>Clear selection</button>
        <Link href="/explore/region">Inspect wire feeds →</Link>
      </div>
    </div>
  )
}

function Related({ items, verified, coverage }: { items: ExploreItem[]; verified: boolean; coverage: Coverage }) {
  const noun = verified ? 'fact-check' : 'article'
  return (
    <div className="card related">
      <div className="map-card-head">
        <div>
          <h2>Related Coverage</h2>
          <p>{plural(items.length, noun)} · {plural(publisherCount(items), 'publisher')}</p>
        </div>
      </div>
      {items.length === 0 ? <p className="explore-note">No items match the current filters.</p> : (
        <ul className="related-list">
          {items.map((i) => (
            <li key={`${i.kind}:${i.id}`} className="related-card">
              <a href={i.url} target="_blank" rel="noopener noreferrer">{i.title}</a>
              <div className="related-meta">
                {i.publisher && <span>{i.publisher}</span>}
                {i.date && <span>{i.date}</span>}
                {i.language && <span>{i.language.toUpperCase()}</span>}
                {i.rating && <span className="tag orange">{i.rating}</span>}
                {i.kind === 'article' && (i.countryCode ? <span className="tag green">{countryName(i.countryCode, coverage)}</span> : <span className="tag gray">Country unknown</span>)}
              </div>
              {i.forClaim && <p>Fact-check of: {i.forClaim}</p>}
              {i.snippet && <p>{i.snippet}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
