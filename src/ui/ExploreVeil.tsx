import '../styles/explore-veil.css'

const PANELS = [1, 2, 3]

// Decorative cloth veil behind the Explore page; geometry, colours and motion live in explore-veil.css. No text, no JS timers.
export function ExploreVeil() {
  return (
    <div className="explore-veil" aria-hidden="true">
      <div className="explore-veil-truth" />
      {PANELS.map((n) => (
        <div key={n} className={`explore-veil-panel explore-veil-panel-${n}`} />
      ))}
    </div>
  )
}
