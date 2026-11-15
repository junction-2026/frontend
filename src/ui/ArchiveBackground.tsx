import '../styles/archive-bg.css'

// Kind per document; position, colour and motion of document n live in archive-bg.css.
const DOCS = ['sheet', 'folder', 'stack', 'box', 'sheet', 'folder'] as const

// Decorative archive backdrop behind History: softly blurred sheets, folders, stacked files and a box under a white veil. No text, no JS timers.
export function ArchiveBackground() {
  return (
    <div className="archive-bg" aria-hidden="true">
      <div className="archive-docs">
        {DOCS.map((kind, i) => (
          <div key={i} className={`archive-doc archive-${kind} archive-doc-${i + 1}`}>
            {kind === 'sheet' && [1, 2, 3].map((n) => <span key={n} className="archive-line" />)}
          </div>
        ))}
      </div>
      <div className="archive-veil" />
    </div>
  )
}
