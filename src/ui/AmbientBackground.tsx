import { useT } from '../i18n'
import '../styles/ambient.css'

const GLOWS = [1, 2, 3, 4]
// Demo cards; a technique id marks the ones that run the propaganda-detection sequence, the rest show the neutral badge.
const CARDS: { n: number; technique?: string }[] = [
  { n: 1, technique: 'Appeal_to_fear-prejudice' },
  { n: 2, technique: 'Loaded_Language' },
  { n: 3 },
  { n: 4 },
  { n: 5, technique: 'Exaggeration,Minimisation' },
  { n: 6 },
]

// Decorative layer; colours, geometry and motion live in ambient.css, all text is fictional demo copy from the `ambient` catalog.
export function AmbientBackground() {
  const t = useT()
  return (
    <div className="ambient-bg" aria-hidden="true">
      <div className="ambient-glows">
        {GLOWS.map((n) => (
          <span key={n} className={`ambient-glow ambient-glow-${n}`} />
        ))}
      </div>
      <div className="ambient-cards">
        {CARDS.map(({ n, technique }) => {
          const text = t(`ambient.card.${n}.text`)
          const phrase = technique ? t(`ambient.card.${n}.phrase`) : ''
          const at = phrase ? text.indexOf(phrase) : -1
          return (
            <div key={n} className={`ambient-card ambient-card-${n}`}>
              <div className="ambient-card-body">
                <div className="ambient-card-head">
                  <span className="ambient-avatar" />
                  <span dir="auto">{t(`ambient.card.${n}.source`)}</span>
                </div>
                <p className="ambient-text" dir="auto">
                  {at < 0 ? text : <>{text.slice(0, at)}<span className="ambient-hl">{phrase}</span>{text.slice(at + phrase.length)}</>}
                </p>
                <span className="ambient-meta" dir="auto">{t(`ambient.card.${n}.meta`)}</span>
                {technique ? (
                  <span className="ambient-badge" dir="auto">{t(`techniques.${technique}.name`)}</span>
                ) : (
                  <span className="ambient-badge ambient-badge-neutral" dir="auto">{t('ambient.no_signals')}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="ambient-veil" />
    </div>
  )
}
