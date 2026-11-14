import { Mock } from '../ui/MockBadge'
import { Link } from '../router'
import { WorldMap } from '../secondary/WorldMap'
import '../secondary/secondary.css'

export default function ExploreView() {
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
            <input aria-label="Topic" defaultValue="Critical infrastructure blame & cyber vector dispers" />
          </label>
          <button type="button" className="field">All Regions ▾</button>
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
              <p>28 verified publishers active across 16 territorial hubs</p>
            </div>
            <div className="zoom-ops">
              <button type="button" aria-label="Zoom in">+</button>
              <button type="button" aria-label="Zoom out">−</button>
              <button type="button" aria-label="Reset">↻</button>
            </div>
          </div>
          <div className="map-stage">
            <WorldMap link />
            <div className="map-tooltip">
              <strong>Finland · 12 articles</strong>
              <p>4 publishers · <span className="ok">0 flagged propaganda</span></p>
              <Link href="/explore/region">Click country to inspect wire feeds →</Link>
            </div>
          </div>
          <div className="map-legend">
            <div className="legend-swatches">
              Coverage density:
              <span className="swatch"><i className="a" /> None</span>
              <span className="swatch"><i className="b" /> Moderate</span>
              <span className="swatch"><i className="c" /> High</span>
            </div>
            <em>Notice: Geographic indicators represent verified publisher operational bureaus, not state responsibility.</em>
          </div>
        </div>
      </Mock>
    </section>
  )
}
