import { Link } from '../router'

// Decorative continents of the mock; Finland is the highlighted (and, on Explore, clickable) region.
const LAND = [
  'M70 80h90l20 30-10 50-40 20-50-25z', 'M180 60h120l40 40-20 70-80 20-70-35z', 'M340 70h80l35 55-25 45-70 10-40-40z',
  'M430 90h110l30 40-15 55-90 25-55-35z', 'M560 100h70l25 35-10 40-55 15-40-25z', 'M650 120h90l20 50-40 40-80 5-20-40z',
  'M760 140h70l10 45-35 35-55-10z', 'M120 180h70l25 45-35 40-60-15z', 'M230 200h90l30 40-50 35-80-10z',
  'M400 210h100l20 45-60 30-80-20z', 'M540 220h80l25 40-45 30-70-15z',
]
const FINLAND = 'M520 95l28-8 22 18-6 34-30 12-24-20z'

export function WorldMap({ compact, link }: { compact?: boolean; link?: boolean }) {
  const land = compact ? LAND.slice(2, 5) : LAND
  const finland = <path d={FINLAND} fill="#6f96d8" style={link ? { cursor: 'pointer' } : undefined} />
  return (
    <svg className="world" style={compact ? { height: 280 } : undefined} viewBox="0 0 900 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="World coverage map (example)">
      <g fill={compact ? '#d7e2f2' : '#c9d8ef'}>{land.map((d) => <path key={d} d={d} />)}</g>
      {link ? <Link href="/explore/region" aria-label="Finland">{finland}</Link> : finland}
      <circle cx="538" cy="118" r="4" fill="#2456c8" />
      <text x="548" y="114" fontSize="11" fill="#2456c8" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700">HELSINKI [HQ]</text>
    </svg>
  )
}
