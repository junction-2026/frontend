# archive-background Specification

## Purpose
Defines the decorative archived-documents backdrop shown behind the History page: its structure, placement, palette, subtlety, motion and reduced-motion behaviour, without altering the real UI.

## Requirements

### Requirement: Archive layer component
`ArchiveBackground` SHALL render one `.archive-bg` with `aria-hidden="true"`, no text, no focusable element and no `tabindex`, containing in this order: `.archive-room`, `.archive-light` (2 or 3 `.archive-shaft` elements), `.archive-dust` (16 to 24 `.archive-mote` elements), `.archive-vignette` and `.archive-scrim`.

#### Scenario: Structure
- **WHEN** `ArchiveBackground` is rendered
- **THEN** there is one hidden `.archive-bg` whose children are, in order, `.archive-room`, `.archive-light`, `.archive-dust`, `.archive-vignette` and `.archive-scrim`, with the child counts above, two SVG shelf layers with at least 4 rows each, and no text, focusable element or `tabindex`

### Requirement: Layer geometry and stacking
`.archive-bg` SHALL be `position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0`. `.archive-bg + .view` SHALL be `position: relative; z-index: 1`. The sticky topbar (z-index 40) SHALL stay above both, no rule SHALL re-enable `pointer-events`, and the document SHALL gain no horizontal overflow at any width from 320px up in LTR and RTL.

#### Scenario: Geometry
- **WHEN** `archive-bg.css` is read
- **THEN** `.archive-bg` has the declarations above, `.archive-bg + .view` has `position: relative` and `z-index: 1`, and no `pointer-events: auto|all` exists

### Requirement: Style isolation and palette
All styles SHALL live in `src/styles/archive-bg.css`, imported only by `ArchiveBackground`, and every selector SHALL contain an `.archive-` class (the existing `.archive-bg + .view` rule is allowed). The scene SHALL use only CSS gradients, solid fills and inline SVG: no `url()` image, no network fetch, no canvas or WebGL and no new dependency.

#### Scenario: Palette and scope
- **WHEN** `archive-bg.css` is read
- **THEN** every selector contains `.archive-`, and no `url(`, `background-image`, canvas or network reference appears

### Requirement: Reduced motion
Under `@media (prefers-reduced-motion: reduce)`, every `.archive-*` element SHALL have `animation: none`, and the shelves, shafts, motes, vignette and scrim SHALL stay visible at their resting state (opacity and display unchanged).

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** no `.archive-*` element animates and the full static scene is still shown

### Requirement: Narrow viewports
Under `@media (max-width: 640px)`, at most 8 `.archive-mote` SHALL stay displayed (the rest `display: none`), `.archive-shelves-far` SHALL be `display: none`, only 1 `.archive-shaft` SHALL be shown, the parallax drift distance SHALL be halved and the scrim SHALL span 100% width. All offsets SHALL use logical properties (`inset-inline-*`) or symmetric values so the RTL (`ar`) layout shows no overflow. Shafts and parallax direction SHALL mirror via a `--flip` custom property under `[dir=rtl]`.

#### Scenario: Phone width
- **WHEN** the viewport is 640px wide or less
- **THEN** motes 9 and up, the far shelves and shafts 2 and 3 are hidden, the near drift is 1.25vw and the scrim is 100% wide

### Requirement: No UI alteration and no dependencies
No existing stylesheet other than `archive-bg.css`, no History markup inside `.view`, no copy, no i18n catalog and no behaviour SHALL change. `package.json` dependencies SHALL be unchanged.

#### Scenario: Untouched UI
- **WHEN** the change is applied
- **THEN** no rule in `archive-bg.css` targets history, filter or export elements and `package.json` dependencies are unchanged

### Requirement: Shelf layers
`.archive-room` SHALL hold `.archive-shelves-far` and `.archive-shelves-near`, each an inline `<svg>` with `focusable="false"` and `aria-hidden="true"` drawing at least 4 floor-to-ceiling shelf rows filled with scroll, parchment-roll, leather-folder, manuscript and document-stack shapes.

#### Scenario: Shelves
- **WHEN** `ArchiveBackground` is rendered
- **THEN** each of the two SVGs has at least 4 shelf rows containing all five shape kinds

### Requirement: Palette
Scene colours SHALL be deep browns, ambers and aged-paper tones written as hex with optional alpha (for example `#1A120B`, `#8A5A2B`, `#E8B96A`, `#F3E3C3`) plus existing `var(--...)` tokens. Cool hues (blue, purple, green) and the old pastel palette SHALL NOT be used.

#### Scenario: Warm colours
- **WHEN** `archive-bg.css` is read
- **THEN** every hex colour is warm (red at least green at least blue) and none is a former pastel colour

### Requirement: Mounting
`HistoryView` SHALL render exactly one `.archive-bg` as the sibling directly before `section.view` (not inside `.view`) in the loading, loaded, empty and error states. `HomeView` and `ExploreView` SHALL render no `.archive-bg`, and `HistoryView` SHALL render no `.ambient-bg`.

#### Scenario: Backdrop placement
- **WHEN** History is rendered in any of its four states
- **THEN** one `.archive-bg` immediately precedes `section.view`, and Home and Explore have none

### Requirement: Lighting
Each `.archive-shaft` SHALL be a warm golden translucent gradient (amber or gold with alpha at most 0.35), angled across the shelves, with `mix-blend-mode: screen` or a plain alpha overlay, and SHALL be static in layout (motion only via `transform` and `opacity` keyframes).

#### Scenario: Shafts
- **WHEN** `archive-bg.css` is read
- **THEN** `.archive-shaft` is a `linear-gradient` of warm stops with alpha at most 0.35 and no layout property is animated

### Requirement: Dust
Each `.archive-mote` SHALL be at most 4px, a warm light colour with opacity 0.2 to 0.7, and SHALL animate only `transform` and `opacity` with infinite loops of 12s to 40s and staggered negative `animation-delay` values. The count SHALL be bounded at 24.

#### Scenario: Motes
- **WHEN** `archive-bg.css` is read
- **THEN** every mote size is at most 4px, every duration is 12s to 40s, the delays are negative and distinct, and mote opacity stays within 0.2 to 0.7

### Requirement: Light shift
`.archive-light` and `.archive-shaft` SHALL animate only `opacity` and/or `transform` (translate, rotate at most 4deg) over 8s to 20s, `ease-in-out`, `infinite`, with equal 0% and 100% frames, giving a slow sunlight or lantern breathing effect without strobing (opacity never changes by more than 0.25 within 1s).

#### Scenario: Breathing
- **WHEN** the shaft keyframes and animations are read
- **THEN** only `opacity` and `transform` change, rotation is at most 4deg, 0% equals 100%, durations are 8s to 20s and the opacity swing is at most 0.25

### Requirement: Parallax
`.archive-shelves-far` and `.archive-shelves-near` SHALL drift only with `translate3d` over 60s to 120s, `ease-in-out`, `infinite`, with equal 0% and 100% frames. The near layer SHALL move at most 2.5% of the viewport width and the far layer less. Each SVG layer SHALL be wider than the viewport by at least the drift distance so no edge is ever exposed, and overflow SHALL stay clipped by `.archive-bg`.

#### Scenario: Shelf drift
- **WHEN** `archive-bg.css` is read
- **THEN** the layers animate `transform` only over 60s to 120s, the near drift is at most 2.5vw, the far drift is smaller, and each layer is at least `100% + 2 * drift` wide

### Requirement: Compositor-friendliness
Every `@keyframes` rule in `archive-bg.css` SHALL change only `transform` and/or `opacity`. Animated elements MAY use `will-change: transform, opacity`. No animated `filter`, `box-shadow`, `width`/`height`, `top`/`left` or `background-position` is allowed. A static `filter: blur()` of at most 8px is allowed only on `.archive-shelves-far`.

#### Scenario: Keyframes
- **WHEN** the keyframes are read
- **THEN** each declares only `transform` and/or `opacity`, and `filter` appears only on `.archive-shelves-far` with a blur of at most 8px

### Requirement: Vignette
`.archive-vignette` SHALL be a radial or linear dark gradient (brown-black with alpha at most 0.75 at the edges and at most 0.25 at the centre) that darkens the edges.

#### Scenario: Edge darkening
- **WHEN** `archive-bg.css` is read
- **THEN** the vignette gradient alpha is at most 0.75 at the edges and at most 0.25 at the centre

### Requirement: Readability scrim
`.archive-scrim` SHALL be a near-white aged-paper panel centred with `inset-inline: 0`, `margin-inline: auto`, `width: min(calc(var(--max) + 3rem), 100%)` and spanning the full viewport height, so the dark-ink History text (`--ink`, `--ink-2`, `--muted`) placed on it keeps at least 4.5:1 contrast while the archive stays visible at the sides.

#### Scenario: Reading contrast
- **WHEN** the scrim colour is blended over the darkest scene colour `#1A120B`
- **THEN** `--ink`, `--ink-2` and `--muted` each reach at least 4.5:1 against it

#### Scenario: Scrim alpha
- **WHEN** the scrim background is read
- **THEN** it is `#FFFDF8` at alpha at least 0.98, because `--muted` (#737373) cannot reach 4.5:1 on a paper at alpha 0.94 or below

### Requirement: Hidden-tab pause
`ArchiveBackground` SHALL subscribe to `document` `visibilitychange` in a `useEffect` and toggle the class `archive-paused` on `.archive-bg` while `document.visibilityState` is `'hidden'`. `.archive-paused` and all its descendants SHALL get `animation-play-state: paused`. The listener SHALL be removed on unmount, and no `requestAnimationFrame`, `setInterval` or `setTimeout` loop SHALL be used.

#### Scenario: Tab hidden
- **WHEN** the tab becomes hidden and later visible
- **THEN** `.archive-bg` gains `archive-paused` and then loses it, and the listener is removed on unmount

### Requirement: Component test coverage
`ArchiveBackground.test.tsx` SHALL assert the layer order and child counts, `aria-hidden`, the absence of text, focusable elements and `tabindex`, `focusable="false"` on the SVGs, and that `archive-paused` follows `visibilitychange` and the listener is removed on unmount.

#### Scenario: Component tests
- **WHEN** `npm test` runs
- **THEN** the component assertions above exist and pass

### Requirement: Stylesheet test coverage
`archive-bg.test.ts` SHALL read `archive-bg.css` and assert the geometry, selector scope, keyframe properties, duration ranges, palette and image bans, the reduced-motion block, the 640px limits, the pause rule, the scrim contrast and that no `pointer-events: auto|all` exists.

#### Scenario: Stylesheet tests
- **WHEN** `npm test` runs
- **THEN** the stylesheet assertions above exist and pass

### Requirement: Integration test coverage
The `archive backdrop` block of `HistoryView.test.tsx` SHALL keep the loading, loaded, empty, error and not-on-Home/Explore assertions and SHALL assert that the heading, lede and filter chips inside `.view` still render with the same roles and texts.

#### Scenario: Integration tests
- **WHEN** `npm test` runs
- **THEN** the mounting and unchanged-`.view` assertions above exist and pass
