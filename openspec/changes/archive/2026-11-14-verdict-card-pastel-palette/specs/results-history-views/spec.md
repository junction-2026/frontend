## MODIFIED Requirements

### Requirement: Verdict component presentation
The verdict card SHALL have a 2px solid border in `var(--v-border)`, a border radius of `var(--radius-verdict)` (30px), padding `clamp(20px, 4vw, 36px)`, a shadow of at most `0 1px 2px rgba(0,0,0,.04)` and no gradient or decorative graphic. It SHALL appear with a fade and rise of at most 300ms, disabled under `prefers-reduced-motion`. Logical CSS properties mirror it in RTL; all states share one layout. Results SHALL NOT use `VERDICT_UI` labels.

#### Scenario: Border
- **WHEN** the card is rendered
- **THEN** its border is 2px solid in the verdict border colour

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** the verdict component has no entrance animation

### Requirement: Verdict states
Each verdict state SHALL use its own tokens from the Verdict tokens requirement of ui-design-foundation, the headline and pill given in Verdict card, and the fixed sentence `results.verdict.<v>.body` (unchanged, see the scenarios). The palette SHALL be selected only by `data-verdict`, which is `verdictOf(result.verdict)`, never by confidence.

#### Scenario: Detected
- **WHEN** the verdict is `detected`
- **THEN** the card uses the red tokens and, when `user_text` yields no usable sentence, the sentence "VEIL identified signs of manipulative messaging in this content."

#### Scenario: Uncertain
- **WHEN** the verdict is `uncertain` or unknown
- **THEN** the card uses the amber tokens and, when `user_text` yields no usable sentence, the sentence "The available evidence is insufficient or conflicting."

#### Scenario: Not detected
- **WHEN** the verdict is `not_detected`
- **THEN** the card uses the green tokens and, when `user_text` yields no usable sentence, the sentence "VEIL did not identify strong indicators of propaganda in this content."

#### Scenario: Confidence does not change the palette
- **WHEN** two results have the same verdict and confidence 0.05 and 0.95
- **THEN** both cards have the same `data-verdict` and so the same palette

### Requirement: Verdict headline typography
The headline SHALL use `var(--font)` (Inter) at weight 800 (`var(--fw-extrabold)`), `font-size: clamp(2rem, 1.25rem + 2.6vw, 3.25rem)`, line-height 1.08, letter-spacing -0.02em and `overflow-wrap: anywhere`, and SHALL be the most prominent element of the card. No other text weight in the card changes.

#### Scenario: Headline size
- **WHEN** the card is rendered
- **THEN** the h2 is at least 32px and at most about 52px

#### Scenario: Headline weight
- **WHEN** the card CSS is read
- **THEN** `.verdict h2` uses `var(--fw-extrabold)` and no other selector in results.css exceeds 600

## ADDED Requirements

### Requirement: Verdict status pill accent
The verdict pill SHALL have background `var(--v-pill-bg)`, a 1px solid `var(--v-border)` border and text `var(--v-pill-text)`. The info-card status dot and the "Read full explanation" link SHALL keep using the verdict pill text and heading tokens, so these accents follow the verdict palette.

#### Scenario: Pill
- **WHEN** a verdict card is rendered
- **THEN** the pill uses the state's bg, a 1px border in the state's border colour and the state's dark text colour

### Requirement: Pulsing status dot
`.verdict-dot` (8px circle, `aria-hidden`) SHALL be filled with `var(--v-pill-text)` and have a box-shadow glow of the same colour at reduced alpha. A keyframe animation SHALL scale the glow and opacity subtly (opacity at least 0.6, scale at most 1.15) with duration between 1.5s and 2s, `ease-in-out`, `infinite`. Under `prefers-reduced-motion: reduce` the dot SHALL have `animation: none` and keep a static glow. Non-verdict state cards SHALL NOT get a pulsing dot.

#### Scenario: Pulse
- **WHEN** a verdict card is rendered
- **THEN** the dot pulses with an infinite ease-in-out animation of 1.8s

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** the dot has no animation and keeps a static glow
