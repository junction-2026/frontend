import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useLocale, useT } from '../i18n'
import { COUNTRIES, HEIGHT, WIDTH, countryName, type Coverage } from './worldMapData'

const FILL = { none: '#E9EDF2', low: '#DCEBFA', medium: '#BFD9F4', high: '#9FC4ED' }
const HOVER = '#A7C9F0'
const SELECTED = '#7FADE5'
const MAX_SCALE = 8
const STEP = 1.5
const TIP = { w: 210, h: 84, gap: 14, pad: 8 }
const DRAG_PX = 3

type View = { k: number; x: number; y: number }
type Hover = { code: string; x: number; y: number; w: number; h: number }
const HOME: View = { k: 1, x: 0, y: 0 }

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
// The scaled map always covers the viewport, so it can never be panned out of sight.
const fit = ({ k, x, y }: View): View => ({ k, x: clamp(x, WIDTH - WIDTH * k, 0), y: clamp(y, HEIGHT - HEIGHT * k, 0) })
function zoomAt(v: View, factor: number, cx: number, cy: number): View {
  const k = clamp(v.k * factor, 1, MAX_SCALE)
  const r = k / v.k
  return fit({ k, x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r })
}

type Props = {
  coverage: Coverage
  selected: string | null
  onSelect?: (code: string | null) => void
  interactive?: boolean
}

export function WorldMap({ coverage, selected, onSelect, interactive = true }: Props) {
  const t = useT()
  const { locale } = useLocale()
  const [view, setView] = useState(HOME)
  const [hover, setHover] = useState<Hover | null>(null)
  const [dragging, setDragging] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const travel = useRef(0) // a drag or pinch must not end in a country click

  useEffect(() => {
    const el = stage.current
    if (!interactive || !el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault() // a native listener: React's wheel handlers are passive
      const r = el.getBoundingClientRect()
      const s = WIDTH / (r.width || WIDTH)
      setView((v) => zoomAt(v, e.deltaY < 0 ? 1.2 : 1 / 1.2, (e.clientX - r.left) * s, (e.clientY - r.top) * s))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [interactive])

  useEffect(() => {
    if (!interactive || !selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !(e.target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))) onSelect?.(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [interactive, selected, onSelect])

  const zoomBy = (f: number) => setView((v) => zoomAt(v, f, WIDTH / 2, HEIGHT / 2))

  const down = (e: PointerEvent) => {
    if (pointers.current.size === 0) travel.current = 0
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }
  const move = (e: PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    const r = svg.current?.getBoundingClientRect()
    if (!prev || !r?.width) return
    const old = [...pointers.current.values()]
    const cur = { x: e.clientX, y: e.clientY }
    pointers.current.set(e.pointerId, cur)
    const s = WIDTH / r.width
    if (old.length === 2) {
      const [a, b] = [...pointers.current.values()]
      const d0 = Math.hypot(old[0].x - old[1].x, old[0].y - old[1].y)
      if (d0 > 0) {
        travel.current = Infinity
        setView((v) => zoomAt(v, Math.hypot(a.x - b.x, a.y - b.y) / d0, ((a.x + b.x) / 2 - r.left) * s, ((a.y + b.y) / 2 - r.top) * s))
      }
      return
    }
    travel.current += Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y)
    if (travel.current <= DRAG_PX) return
    if (!dragging) {
      e.currentTarget.setPointerCapture?.(e.pointerId)
      setDragging(true)
      setHover(null)
    }
    setView((v) => fit({ ...v, x: v.x + (cur.x - prev.x) * s, y: v.y + (cur.y - prev.y) * s }))
  }
  const up = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0) setDragging(false)
  }
  const track = (code: string) => (e: PointerEvent) => {
    if (dragging || pointers.current.size > 1) return
    const r = stage.current!.getBoundingClientRect()
    setHover({ code, x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height })
  }

  const hovered = hover && coverage[hover.code]
  const tipLeft = hover && clamp(hover.x + TIP.gap, TIP.pad, Math.max(TIP.pad, hover.w - TIP.w - TIP.pad))
  const tipTop = hover && clamp(hover.y - TIP.h - TIP.gap > TIP.pad ? hover.y - TIP.h - TIP.gap : hover.y + TIP.gap, TIP.pad, Math.max(TIP.pad, hover.h - TIP.h - TIP.pad))

  return (
    <div ref={stage} className={`map-stage${dragging ? ' dragging' : ''}`}>
      <svg
        ref={svg}
        className="world"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={t('explore.map.aria')}
        onPointerDown={interactive ? down : undefined}
        onPointerMove={interactive ? move : undefined}
        onPointerUp={interactive ? up : undefined}
        onPointerCancel={interactive ? up : undefined}
      >
        <g className="map-view" data-scale={view.k} style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
          {COUNTRIES.map((c) => {
            const live = interactive && c.code !== null
            const isSelected = c.code !== null && c.code === selected
            const isHover = live && hover?.code === c.code
            return (
              <path
                key={c.code ?? c.name}
                className={live ? 'country live' : 'country'}
                d={c.d}
                data-code={c.code ?? undefined}
                data-selected={isSelected ? 'true' : undefined}
                fill={isSelected ? SELECTED : isHover ? HOVER : FILL[(c.code && coverage[c.code]?.level) || 'none']}
                stroke="#FFFFFF"
                strokeWidth={isHover ? 1 : 0.5}
                strokeLinejoin="miter"
                vectorEffect="non-scaling-stroke"
                onPointerEnter={live ? track(c.code!) : undefined}
                onPointerMove={live ? track(c.code!) : undefined}
                onPointerLeave={live ? () => setHover(null) : undefined}
                onClick={live ? () => travel.current <= DRAG_PX && onSelect?.(isSelected ? null : c.code) : undefined}
              />
            )
          })}
        </g>
      </svg>
      {interactive && (
        <div className="zoom-ops">
          <button type="button" aria-label={t('explore.map.zoom_in')} disabled={view.k >= MAX_SCALE} onClick={() => zoomBy(STEP)}>+</button>
          <button type="button" aria-label={t('explore.map.zoom_out')} disabled={view.k <= 1} onClick={() => zoomBy(1 / STEP)}>−</button>
          <button type="button" aria-label={t('explore.map.reset')} onClick={() => setView(HOME)}>↻</button>
        </div>
      )}
      {hover && (
        <div className="map-tooltip" role="tooltip" style={{ left: tipLeft!, top: tipTop!, width: TIP.w }}>
          <strong>{countryName(hover.code, coverage, locale)}</strong>
          {hovered ? (
            <span>{t('explore.map.tooltip_counts', { articles: t('explore.article', { count: hovered.articles }), publishers: t('explore.publisher', { count: hovered.publishers }) })}</span>
          ) : (
            <span>{t('explore.map.no_data')}</span>
          )}
        </div>
      )}
    </div>
  )
}
