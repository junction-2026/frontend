## MODIFIED Requirements

### Requirement: Home-only mounting
`HomeView` SHALL render `<AmbientBackground />` directly before its `<section className="view">`, as a sibling and not inside `.view`, whose `rise` transform animation would become the containing block of a fixed layer. No other decorative layer (in particular no `.noise-headline`) SHALL be rendered behind the home view, and no other view SHALL render `AmbientBackground`.

#### Scenario: Home
- **WHEN** `HomeView` is rendered
- **THEN** exactly one `.ambient-bg` exists, it directly precedes the `.view` section, nothing precedes it and no `.noise-headline` exists

#### Scenario: Other views
- **WHEN** `HistoryView` or `AnalyzingView` is rendered
- **THEN** no `.ambient-bg` exists

### Requirement: Glow shape and blur
Each glow SHALL be 400px to 800px on its longer side with unequal width and height and `max-width: 90vw`. It SHALL use a static `filter: blur()` of 60px to 160px that is never animated, and opacity 0.7 to 0.9 so the colours read as softly colourful, not washed out.

#### Scenario: Shape
- **WHEN** `ambient.css` is read
- **THEN** every glow has unequal sides up to 800px, a static blur of 60px to 160px and opacity 0.7 to 0.9

### Requirement: Card motion
Each card SHALL have its own `@keyframes` that animate only `transform` (translateY from above the viewport to below it, horizontal drift of 16px to 40px, rotation within 3deg) and `opacity` (0 at 0% and 100%, rising to a peak of 0.75 to 0.9 between 10% and 90%). The 0% and 100% frames SHALL both be invisible so the loop never jumps. Durations SHALL be 25s to 45s and distinct per card, with negative `animation-delay` values, `linear` timing and `infinite` iteration.

#### Scenario: Card keyframes
- **WHEN** `ambient.css` is read
- **THEN** each card has distinct keyframes using only transform and opacity, a peak opacity of 0.75 to 0.9, opacity 0 at 0% and 100%, a distinct 25s to 45s duration and a negative delay

### Requirement: Card depth
Cards SHALL use a static `filter: blur()` of 2px to 4px that is never animated in keyframes. `.ambient-card-body` SHALL keep the radius token, the #FFFFFF surface, `var(--shadow)` and the pastel avatar, highlight and badge colours. `backdrop-filter`, `clip-path`, `contain` and SVG filters SHALL NOT be used.

#### Scenario: Depth
- **WHEN** `ambient.css` is read
- **THEN** the `.ambient-card` rule has a blur of 2px to 4px, no keyframes contain `filter` or `blur` and none of the forbidden properties appears

### Requirement: Readability veil
`.ambient-veil` SHALL be a static white radial gradient centred behind the hero and composer, with no animation, no filter, no opacity and `pointer-events: none`. Its centre alpha SHALL be at most #FFFFFF99, it SHALL reach `transparent` by 75% of the ellipse and the ellipse SHALL be no larger than `50% 55%`, so the glows stay visible towards the edges while the hero and composer centre stays clean.

#### Scenario: Veil
- **WHEN** `ambient.css` is read
- **THEN** `.ambient-veil` has a white `radial-gradient` of at most `50% 55%` with centre alpha at most 99 and `transparent` at 75% or earlier, and no animation, filter or opacity declaration

## ADDED Requirements

### Requirement: No decorative patterns
No stylesheet under `src/styles/` SHALL use `repeating-linear-gradient`, `repeating-radial-gradient`, `mask-image` or a `background-image` pattern for decoration, nor `noise-shard` or `noise-flicker` keyframes. A unit test SHALL read `src/styles/*.css` and enforce this. Animation SHALL change only `transform` and `opacity` and no JS animation loop or dependency SHALL be added.

#### Scenario: Stylesheets
- **WHEN** every `src/styles/*.css` file is read
- **THEN** none contains `repeating-linear-gradient`, `repeating-radial-gradient`, `mask-image`, `background-image` or `noise-shard`/`noise-flicker`
