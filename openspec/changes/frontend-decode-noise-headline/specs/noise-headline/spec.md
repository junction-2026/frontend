## Purpose
Defines the decorative, CSS-only "Decode the Noise" glitched background headline shown behind the Analyze (Home) view: its structure, placement, lettering, glitch, fade and reduced-motion behaviour.

## ADDED Requirements

### Requirement: Headline component
`NoiseHeadline` SHALL render one root `.noise-headline` with `aria-hidden="true"` and `dir="ltr"` containing one `.noise-headline-text` whose text is exactly `Decode the Noise` and which carries `data-text="Decode the Noise"`, with no focusable or interactive element, no `tabindex` and no other text.

#### Scenario: Structure
- **WHEN** `NoiseHeadline` is rendered
- **THEN** there is one hidden root with the exact phrase, matching `data-text`, and nothing focusable

### Requirement: Fixed brand phrase
The phrase SHALL be identical in all locales; it is in the static-strings ALLOWED set and no catalog key is added.

#### Scenario: Locales
- **WHEN** the locale is any of en, fr, ar, de, fi, ru
- **THEN** the text is `Decode the Noise`

### Requirement: Mounting
`HomeView` SHALL render `<NoiseHeadline />` immediately before `<AmbientBackground />`, so `.ambient-bg` still directly precedes `section.view`; no other view renders `.noise-headline`.

#### Scenario: Order
- **WHEN** HomeView renders
- **THEN** `.noise-headline` is followed by `.ambient-bg`, then `section.view`

#### Scenario: Other views
- **WHEN** AnalyzingView or HistoryView renders
- **THEN** there is no `.noise-headline`

### Requirement: Isolated styles
Styles SHALL live only in `src/styles/noise-headline.css`, imported by `NoiseHeadline.tsx`; no other stylesheet or token changes, and no new dependency.

#### Scenario: Scope
- **WHEN** the change is applied
- **THEN** ambient.css, base.css, tokens and package.json are unchanged

### Requirement: Layer geometry and stacking
`.noise-headline` SHALL be `position: fixed; inset: 0; overflow: hidden; pointer-events: none; user-select: none; z-index: 0` with flex centring, adding no overflow or layout shift from 320px up, and painting below the ambient blobs, `.view` and the topbar.

#### Scenario: Click-through
- **WHEN** the user clicks over the headline
- **THEN** foreground controls receive the event

### Requirement: Lettering
The text SHALL be `#000`, `font-family: var(--font)`, weight 800-900, `font-size: clamp(64px, 15vw, 240px)`, `line-height` at most 1, case as written, centred, wrapping up to 3 lines, and elongated by `transform: scaleY()` between 1.5 and 2.2.

#### Scenario: Tall black letters
- **WHEN** the stylesheet is read
- **THEN** these declarations are present

### Requirement: Subtlety
The overall opacity SHALL be between 0.05 and 0.12, and opacity/filter/mask declarations SHALL appear only on `.noise-headline*` selectors.

#### Scenario: Contrast
- **WHEN** foreground `--ink` text is drawn over the headline
- **THEN** its contrast is unchanged because the headline is at most 12% opaque

### Requirement: Shards
`.noise-headline-text::before` and `::after` SHALL use `content: attr(data-text)`, be absolutely positioned over the text, show horizontal bands via `clip-path: inset(...)` and be offset by `translateX` of 2px to 12px in opposite directions.

#### Scenario: Sliced look
- **WHEN** the headline is shown
- **THEN** two displaced bands of the phrase overlay the base text

### Requirement: Scanlines and fade
The text SHALL use `mask-image` (and `-webkit-mask-image`) combining a `repeating-linear-gradient` scanline pattern with a `linear-gradient` that reaches alpha 0 in at least one region.

#### Scenario: Partial fade
- **WHEN** the headline is shown
- **THEN** part of the lettering is transparent

### Requirement: Animation
There SHALL be at most 3 `@keyframes` named `noise-*`, animating only `clip-path`, `transform` and `opacity`, with `steps()` timing, an `infinite` 4-12s cycle whose glitch is active for about 20% or less of it, and equal 0% and 100% keyframes; no JS timers, `requestAnimationFrame` or blur animation.

#### Scenario: Calm most of the time
- **WHEN** the animation runs
- **THEN** motion occurs only in brief bursts early in each cycle

### Requirement: Reduced motion
Under `prefers-reduced-motion: reduce` the text and both pseudo-elements SHALL have `animation: none` while the static shard clip-paths, mask and opacity remain.

#### Scenario: Still frame
- **WHEN** reduced motion is requested
- **THEN** the headline stays visible and sharded but does not move

### Requirement: Right-to-left
The root SHALL set `dir="ltr"` and `unicode-bidi: isolate` so the phrase is never reordered and the layer looks the same in `ar`.

#### Scenario: Arabic
- **WHEN** the document direction is rtl
- **THEN** the headline renders identically to LTR locales
