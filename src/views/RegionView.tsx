import { useState } from 'react'
import { rich, useFormat, useLocale, useT } from '../i18n'
import { Link } from '../router'
import { WorldMap } from '../secondary/WorldMap'
import { EXPLORE_MOCK_COVERAGE } from '../secondary/exploreMockCoverage'
import { countryName } from '../secondary/worldMapData'
import { Mock } from '../ui/MockBadge'
import '../secondary/secondary.css'

const CODE = 'FI'
const HOUR = 3_600_000
// Mock wire items: names and text come from the catalog; `age` is how old the dispatch is.
const WIRE = [
  { n: 1, age: 4 * HOUR, cls: 'green' },
  { n: 2, age: 24 * HOUR, cls: 'gray' },
  { n: 3, age: 48 * HOUR, cls: 'gray' },
]

export default function RegionView() {
  const t = useT()
  const { locale } = useLocale()
  const { formatNumber, formatRelativeTime } = useFormat()
  const [now] = useState(Date.now) // mock ages are as of page load
  const country = countryName(CODE, EXPLORE_MOCK_COVERAGE, locale)
  const percent = (v: number) => formatNumber(v, { style: 'percent', minimumFractionDigits: 1 })
  const coords = { minimumFractionDigits: 4, maximumFractionDigits: 4 }
  const STATS = [
    [t('explore.region.stat.coverage'), percent(0.991), t('explore.region.stat.coverage_note')],
    [t('explore.region.stat.polarization'), t('explore.region.stat.polarization_value'), t('explore.region.stat.polarization_note', { variance: formatNumber(1.2, { minimumFractionDigits: 1 }) })],
    [t('explore.region.stat.clusters'), t('explore.region.stat.clusters_value', { n: formatNumber(3) }), t('explore.region.stat.clusters_note')],
    [t('explore.region.stat.verification'), `${formatNumber(4)} / ${formatNumber(4)}`, t('explore.region.stat.verification_note')],
  ]

  return (
    <section className="view">
      <div className="page-head">
        <div className="meta-row"><span>{t('explore.region.breadcrumb')} <strong style={{ color: 'var(--ink)' }}>{t('explore.region.index')}</strong></span></div>
        <h1>{t('explore.title')}</h1>
        <p>{t('explore.region.lede')}</p>
      </div>

      <div className="explore-split">
        <div>
          <Mock block label={t('explore.region.map_label')}>
            <div className="card map-card">
              <div className="map-card-head">
                <span className="status-pill blue">{t('explore.region.selected_pill', { country, dispatches: formatNumber(12) })}</span>
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <span className="btn-primary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>{t('explore.region.selected_chip', { country })}</span>
                  <label className="field" style={{ padding: '0.4rem 0.7rem', minWidth: 140 }}>
                    <span aria-hidden="true" className="mirror-rtl">⌕</span>
                    <input key={country} aria-label={t('explore.region.input_aria')} defaultValue={country} />
                  </label>
                </div>
              </div>
              <WorldMap coverage={EXPLORE_MOCK_COVERAGE} selected={CODE} interactive={false} />
              <div className="map-legend">
                <div className="legend-swatches">
                  <span className="swatch"><i className="sel" /> {t('explore.region.zone_selected')}</span>
                  <span className="swatch"><i className="a" /> {t('explore.region.zone_peripheral')}</span>
                </div>
                <span>{t('explore.region.scan', { lat: formatNumber(60.1699, coords), lon: formatNumber(24.9384, coords), updated: formatRelativeTime(now - 8 * 60_000, now) })}</span>
              </div>
            </div>
          </Mock>
          <Mock block label={t('explore.region.stats_label')}>
            <div className="stat-grid" style={{ marginTop: 0 }}>
              {STATS.map(([label, value, note]) => (
                <div className="card stat" key={label}><div className="label">{label}</div><strong><bdi>{value}</bdi></strong><span>{note}</span></div>
              ))}
            </div>
          </Mock>
        </div>

        <Mock block label={t('explore.region.details_label')}>
          <aside className="card region-panel">
            <div className="region-panel-head">
              <h3><bdi>{CODE}</bdi> {country}</h3>
              <Link href="/explore">{t('explore.region.clear')}</Link>
            </div>
            <div className="mini-stats">
              <div><strong>{formatNumber(12)}</strong><span>{t('explore.region.articles')}</span></div>
              <div><strong>{formatNumber(4)}</strong><span>{t('explore.region.publishers')}</span></div>
              <div><strong>{t('explore.region.lang_primary', { n: formatNumber(8) })}</strong><span>{t('explore.region.lang_secondary', { n: formatNumber(4) })}</span></div>
            </div>
            <div className="synthesis">
              <p>{t('explore.region.synthesis')}</p>
              <div className="row"><span>{rich(t('explore.region.factuality'), { score: <bdi>{percent(0.984)}</bdi> })}</span><span>{t('explore.region.redacted', { n: formatNumber(0) })}</span></div>
            </div>
            {WIRE.map((w) => (
              <div className="wire-item" key={w.n}>
                <div className="top"><span>{t(`explore.region.wire.${w.n}.src`)}</span><span>{formatRelativeTime(now - w.age, now)}</span></div>
                <h4>{t(`explore.region.wire.${w.n}.title`)}</h4>
                <div className="bottom"><span className={`tag ${w.cls}`}>{t(`explore.region.wire.${w.n}.tag`)}</span><button type="button" className="btn-link">{t('explore.region.read')}</button></div>
              </div>
            ))}
          </aside>
        </Mock>
      </div>
    </section>
  )
}
