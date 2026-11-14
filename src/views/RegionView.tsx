import { Link } from '../router'
import { WorldMap } from '../secondary/WorldMap'
import { Mock } from '../ui/MockBadge'
import '../secondary/secondary.css'

const WIRE = [
  { src: 'Helsingin Sanomat', when: '4h ago', title: 'Nordic Grid Operators Report No Anomaly in Regional Power Distribution', tag: 'Verified Source', cls: 'green' },
  { src: 'Yle News', when: 'Yesterday', title: 'Dissecting Telegram Vector Campaigns in Northern European Crossways', tag: 'Investigative Desk', cls: 'gray' },
  { src: 'Hufvudstadsbladet (HBL)', when: '2 days ago', title: 'Editorial: Calm Evidence Beats Panic Narratives on Critical Networks', tag: 'Opinion', cls: 'gray' },
]
const STATS = [
  ['Index Coverage', '99.1%', 'Top-tier public record'],
  ['Polarization', 'Low', '±1.2 index variance'],
  ['Active Clusters', '3 Nodes', 'Grid, Defense, Media'],
  ['Verification', '4 / 4', 'Accredited bureaus'],
]

export default function RegionView() {
  return (
    <section className="view">
      <div className="page-head">
        <div className="meta-row"><span>Global Telemetry / <strong style={{ color: 'var(--ink)' }}>Regional Index</strong></span></div>
        <h1>Explore the world.</h1>
        <p>Discover how stories are covered across sources and regions.</p>
      </div>

      <div className="explore-split">
        <div>
          <Mock block label="Selected region map">
            <div className="card map-card">
              <div className="map-card-head">
                <span className="status-pill blue">● Finland Selected · 12 indexed dispatches</span>
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <span className="btn-primary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>Selected Region: Finland ×</span>
                  <label className="field" style={{ padding: '0.4rem 0.7rem', minWidth: 140 }}>
                    <span aria-hidden="true">⌕</span>
                    <input aria-label="Region" defaultValue="Finland" />
                  </label>
                </div>
              </div>
              <div className="map-stage" style={{ minHeight: 280 }}>
                <WorldMap compact />
              </div>
              <div className="map-legend">
                <div className="legend-swatches">
                  <span className="swatch"><i className="c" /> Selected Zone</span>
                  <span className="swatch"><i className="a" /> Peripheral Scan</span>
                </div>
                <span>Mercator Scan 60.1699° N, 24.9384° E · Updated 8 min ago</span>
              </div>
            </div>
          </Mock>
          <Mock block label="Regional statistics">
            <div className="stat-grid" style={{ marginTop: 0 }}>
              {STATS.map(([label, value, note]) => (
                <div className="card stat" key={label}><div className="label">{label}</div><strong>{value}</strong><span>{note}</span></div>
              ))}
            </div>
          </Mock>
        </div>

        <Mock block label="Region details">
          <aside className="card region-panel">
            <div className="region-panel-head">
              <h3>FI Finland</h3>
              <Link href="/explore">Clear selection ×</Link>
            </div>
            <div className="mini-stats">
              <div><strong>12</strong><span>articles</span></div>
              <div><strong>4</strong><span>verified publishers</span></div>
              <div><strong>Suomi 8</strong><span>EN 4</span></div>
            </div>
            <div className="synthesis">
              <p>Regional framing emphasizes infrastructure integrity and cyber resilience. Attribution language stays cautious; outgroup blame is rare in indexed wire copy.</p>
              <div className="row"><span>Factuality Score: 98.4%</span><span>0 Redacted Statements</span></div>
            </div>
            {WIRE.map((w) => (
              <div className="wire-item" key={w.title}>
                <div className="top"><span>{w.src}</span><span>{w.when}</span></div>
                <h4>{w.title}</h4>
                <div className="bottom"><span className={`tag ${w.cls}`}>{w.tag}</span><button type="button" className="btn-link">Read ↗</button></div>
              </div>
            ))}
          </aside>
        </Mock>
      </div>
    </section>
  )
}
