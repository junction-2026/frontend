import { useState } from 'react'
import { Mock } from '../ui/MockBadge'
import { Link } from '../router'
import { WorldMap } from '../secondary/WorldMap'
import { EXPLORE_MOCK_COVERAGE, coverageSummary } from '../secondary/exploreMockCoverage'
import { SELECTABLE, countryName, type Coverage } from '../secondary/worldMapData'
import '../secondary/secondary.css'

export default function ExploreView() {
  return <Explore coverage={EXPLORE_MOCK_COVERAGE} />
}

export function Explore({ coverage }: { coverage: Coverage }) {
  const [topic, setTopic] = useState('Critical infrastructure blame & cyber vector dispers')
  const [country, setCountry] = useState<string | null>(null)
  const info = country ? coverage[country] : undefined

  return (
    <section className="view">
      <div className="page-head">
        <div className="meta-row"><span>● Topic inquest · Cross-border media topology</span></div>
        <h1>Explore the world.</h1>
        <p>Discover how stories are covered across sources and regions. Coverage density reflects verified publisher bureaus, not state responsibility.</p>
      </div>

      <Mock block label="Explore filters">
        <div className="filters">
          <label className="field">
            <span aria-hidden="true">⌕</span>
            <input aria-label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </label>
          <span className="field">
            <select aria-label="Country" value={country ?? ''} onChange={(e) => setCountry(e.target.value || null)}>
              <option value="">All regions</option>
              {SELECTABLE.map((c) => <option key={c.code} value={c.code}>{countryName(c.code, coverage)}</option>)}
            </select>
            {country && <button type="button" className="field-clear" aria-label="Clear country" onClick={() => setCountry(null)}>×</button>}
          </span>
          <button type="button" className="field">Languages: EN, FR, DE, FI ▾</button>
          <button type="button" className="field">Publishers: All (28) ▾</button>
          <span className="verified-chip">✓ Verified Fact-Checks Only</span>
        </div>
      </Mock>

      <Mock block label="Coverage map">
        <div className="card map-card">
          <div className="map-card-head">
            <div>
              <h2>Geographic Coverage &amp; Publisher Distribution</h2>
              <p>{coverageSummary(coverage)}</p>
            </div>
          </div>
          <WorldMap coverage={coverage} selected={country} onSelect={setCountry} />
          {country && (
            <div className="country-panel">
              <strong>{countryName(country, coverage)}</strong>
              {info ? (
                <span>{info.articles} articles · {info.publishers} publishers</span>
              ) : (
                <span>No verified publisher data for {countryName(country, coverage)}</span>
              )}
              <div className="country-panel-actions">
                <button type="button" className="btn-link" onClick={() => setCountry(null)}>Clear selection</button>
                <Link href="/explore/region">Inspect wire feeds →</Link>
              </div>
            </div>
          )}
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
        </div>
      </Mock>
    </section>
  )
}
