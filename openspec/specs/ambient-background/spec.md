# ambient-background Specification

## Purpose
Defines the decorative animated pastel gradient layer shown behind the Analyze homepage: its structure, placement, palette, motion and reduced-motion behaviour, without altering the real UI.

## Requirements

### Requirement: Ambient layer component
`AmbientBackground` SHALL render one `.ambient-bg` container with `aria-hidden="true"`, no focusable or interactive element and no `tabindex`. It SHALL contain three child layers in this order: `.ambient-glows`, holding exactly 4 `.ambient-glow` elements; `.ambient-cards`, holding 4 to 6 `.ambient-card` elements; and `.ambient-veil`, the readability gradient.

#### Scenario: Structure
- **WHEN** `AmbientBackground` is rendered
- **THEN** there is one `.ambient-bg` with `aria-hidden="true"` whose children are `.ambient-glows` (4 `.ambient-glow`), `.ambient-cards` (4 to 6 `.ambient-card`) and `.ambient-veil` in that order, and no focusable element or `tabindex`

### Requirement: Home-only mounting
`HomeView` SHALL render `<AmbientBackground />` directly before its `<section className="view">`, as a sibling and not inside `.view`, whose `rise` transform animation would become the containing block of a fixed layer. No other decorative layer (in particular no `.noise-headline`) SHALL be rendered behind the home view, and no other view SHALL render `AmbientBackground`.

#### Scenario: Home
- **WHEN** `HomeView` is rendered
- **THEN** exactly one `.ambient-bg` exists, it directly precedes the `.view` section, nothing precedes it and no `.noise-headline` exists

#### Scenario: Other views
- **WHEN** `HistoryView` or `AnalyzingView` is rendered
- **THEN** no `.ambient-bg` exists

### Requirement: Layer geometry and stacking
`.ambient-bg` SHALL be `position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0`. The `.view` directly following it SHALL have `position: relative; z-index: 1`. The sticky topbar (z-index 40) SHALL stay above both. All descendants SHALL inherit `pointer-events: none`, and the document SHALL gain no horizontal overflow at any viewport width from 320px up.

#### Scenario: Geometry
- **WHEN** `ambient.css` is read
- **THEN** the `.ambient-bg` rule has the declarations above, `.ambient-bg + .view` has `position: relative` and `z-index: 1`, and no rule re-enables `pointer-events`

### Requirement: Base surface unchanged
The `body` rule SHALL keep the solid `var(--bg)` background with no gradient. Ambient colours SHALL live only in `src/styles/ambient.css`, which SHALL contain only the four glow colours plus #FFFFFF (veil and card surface), each optionally with alpha, and existing tokens through `var(--...)`. Highlight and badge colours SHALL be those palette colours with alpha.

#### Scenario: Body
- **WHEN** `base.css` is read
- **THEN** the `body` rule has `background: var(--bg)` and no gradient

#### Scenario: Palette
- **WHEN** `ambient.css` is read
- **THEN** every hex is one of the four glow colours or #FFFFFF with optional alpha

### Requirement: Reduced motion
Under `@media (prefers-reduced-motion: reduce)` every glow, card, highlight and badge SHALL have `animation: none`. Glows and veil SHALL remain visible at rest. Cards SHALL be hidden (`display: none`) so no card sits frozen over the content and no badge or highlight sequence runs.

#### Scenario: Reduced motion
- **WHEN** `ambient.css` is read
- **THEN** a `prefers-reduced-motion: reduce` block sets `animation: none` on glows, cards, highlight pseudo-elements and animated badges, hides cards and does not touch the glows' or veil's opacity or display

### Requirement: No UI alteration and no dependencies
`filter`, `opacity` and blur SHALL appear only in rules for `.ambient-glow`, `.ambient-card` and its descendants, `.ambient-veil` and their keyframes. The topbar, hero, composer and buttons SHALL get no filter, opacity, transform or new classes. HomeView markup, copy and behaviour SHALL otherwise be unchanged. No animation or styling library SHALL be added.

#### Scenario: Scope
- **WHEN** `ambient.css` is read
- **THEN** every selector targets an `.ambient-*` class and every `filter`, `opacity` and blur is inside a glow, card or veil rule or a keyframe

### Requirement: Glow palette
Glows SHALL use only Lavender #DDD6FE, Powder blue #BFDBFE, Mint #D1FAE5 and Peach #FFE4D6, each once. Each glow SHALL be one `radial-gradient(closest-side, ...)` of a single palette colour with at least 5 eased, monotonically decreasing alpha stops, ending in `transparent` at 100% or earlier, and no stop past 30% SHALL be opaque.

#### Scenario: Palette and falloff
- **WHEN** `ambient.css` is read
- **THEN** there are four glows with the four palette colours once each, 5+ stops with non-increasing alpha and a transparent last stop

### Requirement: Glow shape and blur
Each glow SHALL be 400px to 800px on its longer side with unequal width and height and `max-width: 90vw`. It SHALL use a static `filter: blur()` of 60px to 160px that is never animated, and opacity 0.7 to 0.9 so the colours read as softly colourful, not washed out.

#### Scenario: Shape
- **WHEN** `ambient.css` is read
- **THEN** every glow has unequal sides up to 800px, a static blur of 60px to 160px and opacity 0.7 to 0.9

### Requirement: Glow animation
Each glow SHALL have its own `@keyframes` declaring only `transform` (translate plus scale between 0.9 and 1.15) with equal 0% and 100% frames, an `animation-duration` of 20s to 40s, `ease-in-out` and `infinite`. No two glows SHALL share keyframe name and duration. Glows SHALL set `will-change: transform`.

#### Scenario: Glow motion
- **WHEN** `ambient.css` is read
- **THEN** every glow has a distinct keyframe name, a 20s to 40s duration, transform-only keyframes with matching 0% and 100% frames and `will-change: transform`

### Requirement: Card content
Each card SHALL resemble a social post or news item: an avatar dot and source line, a 2 to 3 line text snippet and a muted meta line. All text SHALL come from the `ambient` catalog namespace and be fictional demo copy. Cards SHALL NOT show numbers styled as confidence or scores, real outlet or person names, or data fetched from the API. Card text SHALL use `dir="auto"`.

#### Scenario: Catalog-driven text
- **WHEN** `AmbientBackground` is rendered in en and in de
- **THEN** every card source, text and meta equals the `ambient.card.<n>.*` catalog value of that locale and no digit or percent sign is shown

### Requirement: Card placement
Cards SHALL sit in edge columns with their horizontal centre outside the central 70% of the viewport width, at least one card on each side. Cards SHALL never overlap the hero headline, lede, composer or its buttons at viewport widths of 768px, 1280px and 1920px, and SHALL be 200px to 280px wide with a radius from the existing design tokens.

#### Scenario: Placement
- **WHEN** the card placement is evaluated at 768px, 1280px and 1920px
- **THEN** every card centre lies within the outer 15% of the viewport on its side and its right or left edge, with drift margin, stays clear of the 760px composer column

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

### Requirement: Propaganda-detection demo
At least 2 cards SHALL contain a phrase span `.ambient-hl` and a badge `.ambient-badge`, with sequences offset on a shared cycle so at most one card shows it at a time. Each sequence runs in order: highlight fades in as a soft pastel background (palette colour with alpha); badge fades and scales in (0.96 to 1); glow intensifies for 1s to 2s; both fade out while the card keeps drifting. Only `opacity` and `transform` SHALL be animated. Badge text SHALL be the catalog `techniques.<id>.name` value.

#### Scenario: Demo cards
- **WHEN** `AmbientBackground` is rendered
- **THEN** at least 2 cards contain `.ambient-hl` and `.ambient-badge` whose badge text is a technique name from the catalog

#### Scenario: One at a time
- **WHEN** the `--seq` offsets of the demo cards are read
- **THEN** their 10s windows within the shared 180s cycle never overlap

### Requirement: Neutral cards
At least 1 card SHALL show a neutral badge with the catalog text `ambient.no_signals` and no highlight.

#### Scenario: Neutral badge
- **WHEN** `AmbientBackground` is rendered in en
- **THEN** a card without `.ambient-hl` shows a badge reading "No strong signals"

### Requirement: Readability veil
`.ambient-veil` SHALL be a static white radial gradient centred behind the hero and composer, with no animation, no filter, no opacity and `pointer-events: none`. Its centre alpha SHALL be at most #FFFFFF99, it SHALL reach `transparent` by 75% of the ellipse and the ellipse SHALL be no larger than `50% 55%`, so the glows stay visible towards the edges while the hero and composer centre stays clean.

#### Scenario: Veil
- **WHEN** `ambient.css` is read
- **THEN** `.ambient-veil` has a white `radial-gradient` of at most `50% 55%` with centre alpha at most 99 and `transparent` at 75% or earlier, and no animation, filter or opacity declaration

### Requirement: Small screens
Below 768px viewport width at most 2 cards SHALL be shown, dimmer and placed at the edge outside the composer. Below 480px all cards SHALL be `display: none` while the glows and veil stay.

#### Scenario: Media queries
- **WHEN** `ambient.css` is read
- **THEN** a `max-width: 767px` query hides cards 3 and up and dims the rest, and a `max-width: 479px` query sets `display: none` on `.ambient-card`

### Requirement: RTL symmetry
Under `dir=rtl` the decorative layer SHALL stay visually symmetric and without overflow: positions use physical `left` and `right` mirrored between odd and even cards, and card text uses `dir="auto"`.

#### Scenario: Arabic
- **WHEN** the Home view is rendered in ar
- **THEN** the layer is unchanged in geometry and card text elements have `dir="auto"`

### Requirement: No decorative patterns
No stylesheet under `src/styles/` SHALL use `repeating-linear-gradient`, `repeating-radial-gradient`, `mask-image` or a `background-image` pattern for decoration, nor `noise-shard` or `noise-flicker` keyframes. A unit test SHALL read `src/styles/*.css` and enforce this. Animation SHALL change only `transform` and `opacity` and no JS animation loop or dependency SHALL be added.

#### Scenario: Stylesheets
- **WHEN** every `src/styles/*.css` file is read
- **THEN** none contains `repeating-linear-gradient`, `repeating-radial-gradient`, `mask-image`, `background-image` or `noise-shard`/`noise-flicker`
