import { useMemo, useRef, useState } from 'react'
import { errorMessage } from '../../api/errors'
import type { CountryAggregate } from '../../api/mapTypes'
import { useFormat, useT } from '../../i18n'
import { Skeleton } from '../../job/WithJob'
import { WorldMap } from '../../secondary/WorldMap'
import { bundledName, type Coverage } from '../../secondary/worldMapData'
import { Panel } from './Panel'
import { useCountries } from './model'
import { NONE_FILL, STEP_COLORS, makeScale } from './scale'
import '../../job/results.css'
import '../../secondary/secondary.css'
import './propagandaMap.css'

const TOP = 3

export default function PropagandaMap() {
  const t = useT()
  const { formatCountryName } = useFormat()
  const { state, retry } = useCountries()
  const [open, setOpen] = useState<string | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)

  const data = state.status === 'ready' ? state.data : null
  const byCode = useMemo(() => new Map<string, CountryAggregate>((data?.items ?? []).map((c) => [c.country_code, c])), [data])
  const scale = useMemo(() => makeScale(Math.max(0, ...(data?.items ?? []).map((c) => c.analyses))), [data])
  // Names for WorldMap's own labels: the server name is only a fallback for the client-localized one.
  const names = useMemo<Coverage>(() => Object.fromEntries([...byCode].map(([k, c]) => [k, { name: c.country || undefined, articles: 0, publishers: 0, level: 'low' as const }])), [byCode])
  const nameOf = (code: string) => formatCountryName(code, byCode.get(code)?.country || bundledName(code) || code)

  const fillFor = (code: string) => {
    const step = scale.stepOf(byCode.get(code)?.analyses ?? 0)
    return step === null ? NONE_FILL : STEP_COLORS[step]
  }
  const tooltip = (code: string) => {
    const c = byCode.get(code)
    const country = nameOf(code)
    return (
      <>
        <strong><bdi>{country}</bdi></strong>
        {c ? (
          <>
            <span>{t('explore.pmap.tooltip_count', { count: c.analyses, country })}</span>
            {c.techniques.length > 0 && (
              <span>{t('explore.pmap.top_techniques', { list: c.techniques.slice(0, TOP).map((x) => `${x.display} (${x.analyses})`).join(', ') })}</span>
            )}
          </>
        ) : (
          <span>{t('explore.pmap.tooltip_none')}</span>
        )}
      </>
    )
  }
  const close = () => {
    const code = open
    setOpen(null)
    // Back to the country that opened the panel, once the map has re-rendered without it.
    if (code) queueMicrotask(() => stage.current?.querySelector<SVGPathElement>(`path[data-code="${code}"]`)?.focus())
  }
  const select = (code: string | null) => {
    if (code === null) return close()
    setOpen(code)
    setTimeout(() => panel.current?.focus(), 0)
  }

  return (
    <section className="view">
      <div className="page-head">
        <div className="meta-row"><span>{t('explore.eyebrow')}</span></div>
        <h1>{t('explore.title')}</h1>
        <p>{t('explore.pmap.lede')}</p>
      </div>
      <div className="card map-card" ref={stage}>
        <div className="map-card-head">
          <div>
            <h2>{t('explore.pmap.map_title')}</h2>
            <p>{data && data.analyses > 0 ? t('explore.pmap.subtitle', { count: data.analyses, countries: t('explore.country', { count: byCode.size }) }) : t('explore.pmap.map_note')}</p>
          </div>
        </div>
        {state.status === 'loading' && <Skeleton />}
        {state.status === 'error' && (
          <>
            <p role="alert" className="state-error">{errorMessage(state.error)}</p>
            <button type="button" className="btn-secondary" onClick={retry}>{t('explore.retry')}</button>
          </>
        )}
        {data && data.analyses === 0 && <p role="status" className="explore-note">{t('explore.pmap.empty')}</p>}
        <WorldMap coverage={names} selected={open} onSelect={select} interactive={state.status === 'ready'} fillFor={fillFor} renderTooltip={tooltip} focusable />
        {open && <Panel ref={panel} key={open} code={open} name={nameOf(open)} onClose={close} />}
        <div className="map-legend" aria-label={t('explore.pmap.legend')} role="group">
          <div className="legend-swatches">
            {t('explore.pmap.legend')}
            <span className="swatch"><i style={{ background: NONE_FILL }} /> {t('explore.legend.none')}</span>
            {scale.ranges.map((r) => (
              <span key={r.step} className="swatch"><i style={{ background: STEP_COLORS[r.step] }} /> {r.from === r.to ? r.from : `${r.from}–${r.to}`}</span>
            ))}
          </div>
          <em>{t('explore.pmap.notice')}</em>
        </div>
      </div>
    </section>
  )
}
