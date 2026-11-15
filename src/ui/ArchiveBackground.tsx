import { useEffect, useState, type ReactNode } from 'react'
import '../styles/archive-bg.css'

const W = 1600
const H = 900
const ROWS = 4
const BOOKS = 15
const SPLIT = 7 // books before the jump to the right-hand cluster
const LEAN = 6 // index of the leaning book in every row
const TONES = ['#EFEBE4', '#E7E2D9', '#DDD6CA']
const BOARD = '#DDD6CA'

// Deterministic pseudo-random so the scene is identical on every render and in tests.
function lcg(seed: number) {
  let s = seed
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296
}

// One bookshelf: ROWS boards, each with BOOKS upright spines of varying height (one leaning) in a left and a right cluster.
function shelves(): ReactNode {
  const r = lcg(11)
  const rowH = H / ROWS
  const rows = Array.from({ length: ROWS }, (_, row) => {
    const base = (row + 1) * rowH - 10
    let x = 24
    const books = Array.from({ length: BOOKS }, (_, n) => {
      const w = 22 + r() * 18
      const h = 90 + r() * 90
      const lean = n === LEAN
      const x0 = x
      x = n === SPLIT - 1 ? W - 310 : x + w + 3 + r() * 4 // two clusters, so both sides of the reading column show books
      return <rect key={n} x={x0} y={base - h} width={w} height={h} rx={2} fill={TONES[n % TONES.length]} transform={lean ? `rotate(12 ${x0 + w} ${base})` : undefined} />
    })
    return (
      <g key={row} className="archive-row">
        {books}
        <rect x={0} y={base} width={W} height={10} fill={BOARD} />
      </g>
    )
  })
  return (
    <svg className="archive-shelves" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true">
      {rows}
    </svg>
  )
}

const SHELVES = shelves()

// Decorative light, static library backdrop behind History: one SVG bookshelf and an opaque reading scrim. No text; animations (none today) pause while the tab is hidden.
export function ArchiveBackground() {
  const [paused, setPaused] = useState(() => document.visibilityState === 'hidden')
  useEffect(() => {
    const sync = () => setPaused(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])
  return (
    <div className={paused ? 'archive-bg archive-paused' : 'archive-bg'} aria-hidden="true">
      <div className="archive-room">{SHELVES}</div>
      <div className="archive-scrim" />
    </div>
  )
}
