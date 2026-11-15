# explore-veil Specification

## Purpose
Defines the decorative animated cloth veil shown behind the Explore page: its structure, placement, palette, motion and reduced-motion behaviour, without altering the real UI.

## Requirements

### Requirement: Veil component
`ExploreVeil` SHALL render one `.explore-veil` with `aria-hidden="true"`, no focusable element and no `tabindex`, containing in order one `.explore-veil-truth` and then 2 or 3 `.explore-veil-panel` elements. It SHALL render no text.

#### Scenario: Structure
- **WHEN** `ExploreVeil` is rendered
- **THEN** there is one hidden `.explore-veil` whose first child is `.explore-veil-truth`, followed by 2 or 3 `.explore-veil-panel`, and no text or focusable element

### Requirement: Explore-only mounting
`ExploreView` SHALL render `<ExploreVeil />` as the sibling directly preceding the `.view` section in both modes (with a job: `ExploreJob`; without: `PropagandaMap`), not inside `.view`, whose `rise` transform would capture the fixed layer. No other view SHALL render it.

#### Scenario: Both modes
- **WHEN** `ExploreView` is rendered with and without a job id
- **THEN** exactly one `.explore-veil` exists and it directly precedes `section.view`

#### Scenario: Other views
- **WHEN** `HomeView` is rendered
- **THEN** no `.explore-veil` exists

### Requirement: Layer geometry and stacking
`.explore-veil` SHALL be `position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0`. `.explore-veil + .view` SHALL be `position: relative; z-index: 1`. The sticky topbar (z-index 40) SHALL stay above both. No rule SHALL re-enable pointer events. The document SHALL gain no horizontal overflow at any width from 320px up, in LTR and RTL.

#### Scenario: Geometry
- **WHEN** `explore-veil.css` is read
- **THEN** `.explore-veil` has the declarations above, `.explore-veil + .view` has `position: relative` and `z-index: 1`, and no `pointer-events: auto|all` exists

### Requirement: Style isolation and palette
All veil styles SHALL live in `src/styles/explore-veil.css`, imported by `ExploreVeil`. Every selector SHALL target an `.explore-veil*` class. Hex colours SHALL be only Lavender `#DDD6FE`, Powder blue `#BFDBFE` and `#FFFFFF`, each optionally with alpha, plus existing tokens via `var(--...)`. Body, Explore, map and panel styles SHALL be untouched.

#### Scenario: Palette
- **WHEN** `explore-veil.css` is read
- **THEN** every hex colour is one of the three palette colours (with optional alpha) and every selector contains `.explore-veil`

### Requirement: Cloth look
Each panel SHALL use layered `linear-gradient`s of alternating translucent light and darker bands (at least 4 fold bands) for soft vertical folds, with panel opacity between 0.15 and 0.4 at rest so content contrast is unchanged. Any blur SHALL be a static filter of at most 40px and SHALL never be animated.

#### Scenario: Folds
- **WHEN** `explore-veil.css` is read
- **THEN** the panel cloth has at least 4 darker and 4 light gradient stops, the panel rest opacity is within 0.15 to 0.4, and no `@keyframes` contains `filter` or `blur`

### Requirement: Sway
Each panel SHALL have its own `@keyframes` declaring only `transform` (small translate, `skewX` within ±3deg, `scaleY` 0.98 to 1.03) with equal 0% and 100% frames, a duration of 8s to 16s, `ease-in-out` and `infinite`, with durations that differ between panels. Panels SHALL set `will-change: transform`.

#### Scenario: Sway timing
- **WHEN** `explore-veil.css` is read
- **THEN** each panel sways with its own transform-only keyframes of 8s to 16s, with distinct durations and equal 0% and 100% frames

### Requirement: Reveal
A separate per-panel reveal animation (`transform` and `opacity` only, combined with the sway through a wrapper element) SHALL have a cycle of 15s to 30s, with durations that differ between panels. It SHALL hold closed for most of the cycle; in a window of 3s to 6s it SHALL ease the panels outward (the first toward the inline-start side, the last toward the inline-end side, the middle one lifted upward) by 25% to 50% and lower their opacity, then return to the identical 0% and 100% rest frame.

#### Scenario: Reveal timing
- **WHEN** `explore-veil.css` is read
- **THEN** each panel's reveal has its own keyframes and a distinct cycle of 15s to 30s, is closed for the first half of the cycle or more, opens and closes within 3s to 6s by 25% to 50%, and has equal 0% and 100% frames

### Requirement: Truth layer
`.explore-veil-truth` SHALL be a static soft `radial-gradient` glow from the palette (opacity at most 0.5), visually covered by the closed panels and visible only when they part. It SHALL carry no text or data.

#### Scenario: Glow
- **WHEN** `explore-veil.css` is read
- **THEN** `.explore-veil-truth` has a `radial-gradient`, an opacity of at most 0.5 and no animation

### Requirement: Reduced motion
Under `@media (prefers-reduced-motion: reduce)` every veil animation SHALL be `animation: none`, with the panels static in the closed rest position and still visible.

#### Scenario: Reduced motion
- **WHEN** `explore-veil.css` is read
- **THEN** the reduced-motion block sets `animation: none` on `.explore-veil-panel` and `.explore-veil-panel::before` and hides nothing

### Requirement: CSS-only performance
Animation SHALL be CSS-only (no `setInterval`, `setTimeout`, `requestAnimationFrame` or JS-driven styles), so browsers throttle it in hidden tabs. No npm dependency SHALL be added.

#### Scenario: No timers
- **WHEN** `ExploreVeil.tsx` is read
- **THEN** it contains no timer, animation-frame call or inline style
