# archive-background Specification

## Purpose
Defines the light, low-detail, static library-shelf backdrop shown behind the History page, matching the neutral app palette: its structure, placement, colours and reduced-motion behaviour, without altering the real UI.

## Requirements

### Requirement: Archive layer component
`ArchiveBackground` SHALL render one `.archive-bg` with `aria-hidden="true"`, no text, no focusable element and no `tabindex`. Its children SHALL be, in order, exactly `.archive-room` and `.archive-scrim`. `.archive-light`, `.archive-shaft`, `.archive-dust`, `.archive-mote` and `.archive-vignette` SHALL NOT be rendered.

#### Scenario: Structure
- **WHEN** `ArchiveBackground` is rendered
- **THEN** there is one hidden `.archive-bg` whose children are, in order, `.archive-room` and `.archive-scrim`, with no text, focusable element or `tabindex`, and none of the removed classes

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
Under `@media (prefers-reduced-motion: reduce)`, `.archive-bg` and `.archive-bg *` SHALL have `animation: none` and `transition: none`, and the static scene SHALL stay visible (opacity and display unchanged).

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** nothing animates and the static scene is still shown

### Requirement: Narrow viewports
Under `@media (max-width: 640px)`, `.archive-scrim` SHALL span 100% width with `border-inline: 0`. All offsets SHALL use logical properties or symmetric values, and no horizontal overflow SHALL occur from 320px up in LTR and RTL (`ar`).

#### Scenario: Phone width
- **WHEN** the viewport is 640px wide or less
- **THEN** the scrim is 100% wide without side borders and `archive-bg.css` has no `--flip`, mote, far-layer or shaft rule

### Requirement: No UI alteration and no dependencies
No existing stylesheet other than `archive-bg.css`, no History markup inside `.view`, no copy, no i18n catalog and no behaviour SHALL change. `package.json` dependencies SHALL be unchanged.

#### Scenario: Untouched UI
- **WHEN** the change is applied
- **THEN** no rule in `archive-bg.css` targets history, filter or export elements and `package.json` dependencies are unchanged

### Requirement: Shelf layers
`.archive-room` SHALL hold exactly one inline `<svg class="archive-shelves" focusable="false" aria-hidden="true">`. It SHALL draw 3 to 5 shelf boards (each a `<g class="archive-row">`) with upright book-spine rects of varying height and at least one leaning book, using deterministic geometry and `preserveAspectRatio="xMidYMid slice"`. The far and near layers and the scroll, folder, manuscript, roll and stack shapes SHALL NOT exist.

#### Scenario: Shelves
- **WHEN** `ArchiveBackground` is rendered
- **THEN** `.archive-room` has one SVG with 3 to 5 `.archive-row` groups built only from `<rect>`, `<line>` or `<path>` (at most 80 shapes, `rx` at most 2), spines of differing height, at least one rotated (leaning) book, no `.archive-shelves-far`/`.archive-shelves-near` and no removed shape classes

### Requirement: Palette
`.archive-room` background SHALL be `var(--bg)`. Scene colours SHALL be `var(--bg)`, `var(--surface)`, `var(--line)`, `var(--line-strong)` or light warm-neutral hex (optional alpha). No dark, near-black or cool (blue, purple, green) colour SHALL be used.

#### Scenario: Warm colours
- **WHEN** `archive-bg.css` and the SVG fills and strokes are read
- **THEN** every hex has each channel at least `0xC8`, R >= G >= B and R - B <= `0x18` (for example `#EFEBE4`, `#E7E2D9`, `#DDD6CA`), every shelf colour is at most 1.6:1 against `#FAFAF9`, and `.archive-room` is `var(--bg)`

### Requirement: Mounting
`HistoryView` SHALL render exactly one `.archive-bg` as the sibling directly before `section.view` (not inside `.view`) in the loading, loaded, empty and error states. `HomeView` and `ExploreView` SHALL render no `.archive-bg`, and `HistoryView` SHALL render no `.ambient-bg`.

#### Scenario: Backdrop placement
- **WHEN** History is rendered in any of its four states
- **THEN** one `.archive-bg` immediately precedes `section.view`, and Home and Explore have none

### Requirement: Compositor-friendliness
`archive-bg.css` SHALL contain no `will-change`, no `filter` and no animated property, because the scene is static.

#### Scenario: Keyframes
- **WHEN** `archive-bg.css` is read
- **THEN** no `will-change`, `filter` or `@keyframes` appears

### Requirement: Readability scrim
`.archive-scrim` SHALL be centred with `inset-block: 0`, `inset-inline: 0`, `margin-inline: auto` and `width: min(calc(var(--max) + 3rem), 100%)`, with opaque `background: var(--surface)` and `border-inline: 1px solid var(--line)`. It SHALL have no shadow, or a shadow whose colour alpha is at most `0x14` over `#000`. `--ink`, `--ink-2` and `--muted` therefore have at least 4.5:1 against it.

#### Scenario: Reading contrast
- **WHEN** the scrim rule is read
- **THEN** it matches the declarations above, so `--muted` (`#737373` on `#FFFFFF`, 4.74:1), `--ink` and `--ink-2` reach at least 4.5:1

#### Scenario: Scrim alpha
- **WHEN** the scrim background is read
- **THEN** it is the opaque `var(--surface)` with no alpha channel and no translucency

### Requirement: Hidden-tab pause
`ArchiveBackground` SHALL subscribe to `document` `visibilitychange` in a `useEffect` and toggle the class `archive-paused` on `.archive-bg` while `document.visibilityState` is `'hidden'`. `.archive-paused` and all its descendants SHALL get `animation-play-state: paused`. The listener SHALL be removed on unmount, and no `requestAnimationFrame`, `setInterval` or `setTimeout` loop SHALL be used.

#### Scenario: Tab hidden
- **WHEN** the tab becomes hidden and later visible
- **THEN** `.archive-bg` gains `archive-paused` and then loses it, and the listener is removed on unmount

### Requirement: Component test coverage
`ArchiveBackground.test.tsx` SHALL assert the structure, the single hidden shelf SVG, the absence of the removed classes, and that `archive-paused` follows `visibilitychange`.

#### Scenario: Component tests
- **WHEN** `npm test` runs
- **THEN** the two children in order, the single `.archive-shelves` SVG with `focusable="false"`, 3 to 5 `.archive-row` groups, at most 80 shapes, the absence of `.archive-shaft`, `.archive-mote`, `.archive-vignette` and the far/near layers, `aria-hidden`, no text, focusable element or `tabindex`, `archive-paused` toggling and listener removal on unmount are asserted and pass

### Requirement: Stylesheet test coverage
`archive-bg.test.ts` SHALL read `archive-bg.css` and assert the geometry, selector scope, bans, palette, motion guards and scrim rules, and SHALL check the SVG fills and strokes of the component against the same palette rule.

#### Scenario: Stylesheet tests
- **WHEN** `npm test` runs
- **THEN** geometry, selector scope, image and canvas bans, no `@keyframes`, `filter` or `will-change`, the palette rule, the reduced-motion block, the 640px scrim rule, the pause rule, the opaque `var(--surface)` scrim, no `pointer-events: auto|all` and the SVG palette check are asserted and pass

### Requirement: Integration test coverage
The `archive backdrop` block of `HistoryView.test.tsx` SHALL keep the loading, loaded, empty, error and not-on-Home/Explore assertions and SHALL assert that the heading, lede and filter chips inside `.view` still render with the same roles and texts.

#### Scenario: Integration tests
- **WHEN** `npm test` runs
- **THEN** the mounting and unchanged-`.view` assertions above exist and pass

### Requirement: Motion
`archive-bg.css` SHALL contain no `@keyframes` rule and no `animation` or `transition` declaration other than the reduced-motion guard (`animation: none`, `transition: none`) and the hidden-tab pause guard (`animation-play-state: paused`). The scene is static.

#### Scenario: Static scene
- **WHEN** `archive-bg.css` is read
- **THEN** it has no `@keyframes` and its only `animation`/`transition` declarations are the guards above
