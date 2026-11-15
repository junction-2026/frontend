import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import '../styles/archive-bg.css'

type Tone = { cols: string[]; paper: string[]; band: string }
const NEAR: Tone = { cols: ['#3D2A1A', '#5C3D24', '#8A5A2B', '#2B1D12'], paper: ['#E8B96A', '#F3E3C3', '#C08A3E'], band: '#C08A3E' }
const FAR: Tone = { cols: ['#2B1D12', '#3D2A1A', '#5C3D24'], paper: ['#8A5A2B', '#C08A3E', '#5C3D24'], band: '#8A5A2B' }
const W = 1600
const H = 900

// Deterministic pseudo-random so the scene is identical on every render and in tests.
function lcg(seed: number) {
  let s = seed
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296
}

// One shelf unit: `rows` boards from floor to ceiling, each packed with scrolls, rolls, folders, manuscripts and stacks.
function shelves(cls: string, tone: Tone, rows: number, seed: number): ReactNode {
  const r = lcg(seed)
  const pick = (a: string[]) => a[Math.floor(r() * a.length)]
  const rowH = H / rows
  const out: ReactNode[] = []
  for (let row = 0; row < rows; row++) {
    const base = (row + 1) * rowH - 12
    const items: ReactNode[] = []
    for (let x = 16, n = 0; x < W - 20; n++) {
      const c = pick(tone.cols)
      const p = pick(tone.paper)
      const k = Math.floor(r() * 5)
      const room = rowH - 40
      let w: number
      let g: ReactNode
      if (k === 0) {
        w = 18 + r() * 16
        const h = Math.min(room, 90 + r() * 50)
        g = <g className="archive-folder"><rect x={x} y={base - h} width={w} height={h} rx={2} fill={c} /><rect x={x + 3} y={base - h + 8} width={3} height={h - 16} fill={tone.band} /><rect x={x + 9} y={base - h * 0.6} width={w - 13} height={12} fill={p} /></g>
      } else if (k === 1) {
        w = 24 + r() * 16
        const h = Math.min(room, 70 + r() * 50)
        g = <g className="archive-manuscript"><rect x={x} y={base - h} width={w} height={h} fill={c} /><rect x={x} y={base - h} width={w} height={5} fill={tone.band} /><rect x={x} y={base - 5} width={w} height={5} fill={tone.band} /><rect x={x + w / 2 - 1} y={base - h + 12} width={2} height={h - 24} fill={p} /></g>
      } else if (k === 2) {
        w = 12 + r() * 6
        const h = Math.min(room, 80 + r() * 40)
        g = <g className="archive-scroll"><rect x={x} y={base - h} width={w} height={h} rx={w / 2} fill={p} /><rect x={x} y={base - h * 0.55} width={w} height={6} fill={tone.band} /><ellipse cx={x + w / 2} cy={base - h + 3} rx={w / 2} ry={3} fill={c} /></g>
      } else if (k === 3) {
        w = 60 + r() * 30
        const h = 16 + r() * 6
        g = <g className="archive-roll"><rect x={x} y={base - h} width={w} height={h} rx={h / 2} fill={p} /><rect x={x + 8} y={base - h} width={5} height={h} fill={tone.band} /><rect x={x + w - 13} y={base - h} width={5} height={h} fill={tone.band} /><rect x={x + 6} y={base - 2 * h} width={w - 14} height={h} rx={h / 2} fill={c} /></g>
      } else {
        w = 70 + r() * 30
        g = <g className="archive-stack">{[0, 1, 2, 3].map((i) => <rect key={i} x={x + (r() - 0.5) * 8} y={base - (i + 1) * 11} width={w} height={10} fill={i % 2 ? c : p} />)}</g>
      }
      items.push(<g key={n}>{g}</g>)
      x += w + 4 + r() * 6
    }
    out.push(
      <g key={row} className="archive-row">
        {items}
        <rect x={0} y={base} width={W} height={12} fill={tone.band} />
      </g>,
    )
  }
  const posts = [0, 400, 800, 1200, W - 8].map((x) => <rect key={x} x={x} y={0} width={8} height={H} fill="#1A120B" />)
  return (
    <svg className={cls} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true">
      {out}
      {posts}
    </svg>
  )
}

const FAR_SHELVES = shelves('archive-shelves-far', FAR, 5, 7)
const NEAR_SHELVES = shelves('archive-shelves-near', NEAR, 4, 31)

// Mote positions are inline custom properties; size, duration and phase are nth-child rules in archive-bg.css.
const MOTES = Array.from({ length: 20 }, (_, i) => ({ '--x': `${(i * 37 + 8) % 96}%`, '--y': `${(i * 53 + 12) % 92}%` }) as CSSProperties)

// Decorative dark archive library behind History: SVG shelves, light shafts, dust, vignette and a reading scrim. No text, no JS timers; animations pause while the tab is hidden.
export function ArchiveBackground() {
  const [paused, setPaused] = useState(() => document.visibilityState === 'hidden')
  useEffect(() => {
    const sync = () => setPaused(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])
  return (
    <div className={paused ? 'archive-bg archive-paused' : 'archive-bg'} aria-hidden="true">
      <div className="archive-room">
        {FAR_SHELVES}
        {NEAR_SHELVES}
      </div>
      <div className="archive-light">
        <div className="archive-shaft" />
        <div className="archive-shaft" />
        <div className="archive-shaft" />
      </div>
      <div className="archive-dust">
        {MOTES.map((s, i) => <span key={i} className="archive-mote" style={s} />)}
      </div>
      <div className="archive-vignette" />
      <div className="archive-scrim" />
    </div>
  )
}
