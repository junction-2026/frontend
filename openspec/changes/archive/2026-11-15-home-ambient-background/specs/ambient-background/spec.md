## Purpose
Defines the decorative animated pastel gradient layer shown behind the Analyze homepage: its structure, placement, palette, motion and reduced-motion behaviour, without altering the real UI.

## ADDED Requirements

### Requirement: Ambient layer component
`AmbientBackground` SHALL render one container element with class `ambient-bg` and `aria-hidden="true"` containing between 5 and 7 blob elements, and no text, focusable or interactive content.

#### Scenario: Structure
- **WHEN** `AmbientBackground` is rendered
- **THEN** there is one `.ambient-bg` with `aria-hidden="true"` and 5 to 7 `.ambient-blob` children and no focusable element

### Requirement: Home-only mounting
`HomeView` SHALL render `AmbientBackground` as a sibling preceding its `<section className="view">`, not inside `.view`, whose `rise` transform animation would become the containing block of a fixed layer. No other view SHALL render it.

#### Scenario: Home
- **WHEN** `HomeView` is rendered
- **THEN** exactly one `.ambient-bg` exists and it directly precedes the `.view` section

#### Scenario: Other views
- **WHEN** `HistoryView` or `AnalyzingView` is rendered
- **THEN** no `.ambient-bg` exists

### Requirement: Layer geometry and stacking
`.ambient-bg` SHALL be `position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0`. The `.view` directly following it SHALL have `position: relative; z-index: 1`. The sticky topbar (z-index 40) SHALL stay above both. The document SHALL gain no horizontal overflow at any viewport width from 320px up.

#### Scenario: Geometry
- **WHEN** `ambient.css` is read
- **THEN** the `.ambient-bg` rule has the declarations above and `.ambient-bg + .view` has `position: relative` and `z-index: 1`

### Requirement: Blob palette
Blobs SHALL use only lavender #C4B5FD, sky blue #93C5FD, mint #86EFAC, soft peach #FDBA9A and light pink #F9A8D4, each painted as a `radial-gradient` from the colour to transparent, and each of the five colours SHALL appear at least once.

#### Scenario: Palette
- **WHEN** `ambient.css` is read
- **THEN** every colour appears in a `radial-gradient(... , transparent)` and no other hex colour is present

### Requirement: Blob shape, blur and placement
Each blob SHALL be absolutely positioned, between 300px and 600px on its longer side (it MAY shrink with `vw` on narrow viewports), have unequal width and height, `filter: blur()` between 100px and 160px and opacity between 0.35 and 0.45. At least one blob SHALL be anchored past the left edge and one past the right edge of the viewport, and at least one SHALL sit behind the hero and composer area.

#### Scenario: Shape
- **WHEN** `ambient.css` is read
- **THEN** every blob width and height is 300px to 600px, width differs from height, blur is 100px to 160px and opacity is 0.35 to 0.45

#### Scenario: Placement
- **WHEN** `ambient.css` is read
- **THEN** a blob has a negative `left`, a blob has a negative `right` and a blob is placed near the horizontal centre

### Requirement: Base surface unchanged
The `body` rule SHALL keep the solid `var(--bg)` background with no gradient. Ambient colours SHALL live only in `src/styles/ambient.css`.

#### Scenario: Body
- **WHEN** `base.css` is read
- **THEN** the `body` rule has `background: var(--bg)` and no gradient

### Requirement: Blob animation
Each blob SHALL have its own `@keyframes` drift (translate plus scale between 0.9 and 1.15) with `animation-duration` between 18s and 35s, `infinite` iteration and an `ease-in-out` easing. The 0% and 100% keyframes SHALL be equal. No two blobs SHALL share keyframe name and duration. Only `transform` SHALL be animated and blobs SHALL set `will-change: transform`.

#### Scenario: Motion
- **WHEN** `ambient.css` is read
- **THEN** every blob has a distinct keyframe name and a duration of 18s to 35s, keyframes declare only `transform`, and 0% and 100% match

### Requirement: Reduced motion
Under `@media (prefers-reduced-motion: reduce)` every blob SHALL have `animation: none` while remaining rendered at its static position and opacity.

#### Scenario: Reduced motion
- **WHEN** `ambient.css` is read
- **THEN** a `prefers-reduced-motion: reduce` block sets `animation: none` on `.ambient-blob` and does not change `opacity` or `display`

### Requirement: No UI alteration and no dependencies
No `filter`, `backdrop-filter`, `opacity` or blur SHALL be added to the topbar, hero, composer, buttons or any other real UI element. HomeView markup, copy, classes and behaviour SHALL otherwise be unchanged. No animation or styling library SHALL be added.

#### Scenario: Scope
- **WHEN** `ambient.css` is read
- **THEN** every `filter` and `opacity` declaration is inside an `.ambient-blob` rule
