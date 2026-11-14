import '../styles/ambient.css'

const BLOBS = [1, 2, 3, 4, 5, 6]

// Decorative pastel layer; colours, geometry and motion live in ambient.css.
export function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      {BLOBS.map((n) => (
        <span key={n} className={`ambient-blob ambient-blob-${n}`} />
      ))}
    </div>
  )
}
