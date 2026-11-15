import '../styles/noise-headline.css'

// Decorative glitched headline; a fixed brand phrase, intentionally not localized.
export function NoiseHeadline() {
  return (
    <div className="noise-headline" aria-hidden="true" dir="ltr">
      <span className="noise-headline-text" data-text="Decode the Noise">Decode the Noise</span>
    </div>
  )
}
