## Purpose
Defines the decorative archived-documents backdrop shown behind the History page: its structure, placement, palette, subtlety, motion and reduced-motion behaviour, without altering the real UI.

## ADDED Requirements

### Requirement: Archive layer component
`ArchiveBackground` SHALL render one `.archive-bg` with `aria-hidden="true"`, no text, no focusable element and no `tabindex`, containing in order a `.archive-docs` group of 5 to 8 `.archive-doc` elements (each a sheet, folder, stacked-files or archive-box shape drawn with DOM elements or inline SVG with `focusable="false"`) and then one `.archive-veil`.

#### Scenario: Structure
- **WHEN** `ArchiveBackground` is rendered
- **THEN** there is one hidden `.archive-bg` whose children are `.archive-docs` (5 to 8 `.archive-doc`) and `.archive-veil`, with no text or focusable element

### Requirement: Layer geometry and stacking
`.archive-bg` SHALL be `position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0`. `.archive-bg + .view` SHALL be `position: relative; z-index: 1`. The sticky topbar (z-index 40) SHALL stay above both, no rule SHALL re-enable `pointer-events`, and the document SHALL gain no horizontal overflow at any width from 320px up in LTR and RTL.

#### Scenario: Geometry
- **WHEN** `archive-bg.css` is read
- **THEN** `.archive-bg` has the declarations above, `.archive-bg + .view` has `position: relative` and `z-index: 1`, and no `pointer-events: auto|all` exists

### Requirement: Style isolation and palette
All styles SHALL live in `src/styles/archive-bg.css`, imported only by `ArchiveBackground`. Every selector SHALL target an `.archive-*` class. Hex colours SHALL be only Lavender `#DDD6FE`, Powder blue `#BFDBFE`, Mint `#D1FAE5`, Peach `#FFE4D6` and `#FFFFFF`, each optionally with alpha, plus existing tokens via `var(--...)`. No `rgb()`/`hsl()` notation, `background-image`, `mask-image` or repeating gradient SHALL be used, and no image SHALL be fetched over the network.

#### Scenario: Palette and scope
- **WHEN** `archive-bg.css` is read
- **THEN** every hex colour is a palette colour (with optional alpha), every selector contains `.archive-`, and no image, mask or repeating gradient appears

### Requirement: Subtlety and readability
Each `.archive-doc` SHALL have `opacity` from 0.25 to 0.6 and MAY have a static `filter: blur()` of at most 6px. `.archive-veil` SHALL be a white (`#FFFFFF` with alpha) gradient above the documents, so history text and controls keep their current contrast. `filter`, `opacity` and blur SHALL appear only in `.archive-doc`, `.archive-veil` and keyframe rules.

#### Scenario: Subtle documents
- **WHEN** `archive-bg.css` is read
- **THEN** `.archive-doc` opacity is within 0.25 to 0.6, any blur is at most 6px, and `.archive-veil` is a `linear-gradient` of white-with-alpha stops

### Requirement: Optional motion
Any animation SHALL be transform-only (translate and/or rotate of at most 3deg), with a duration of 30s to 60s, `ease-in-out` and `infinite`, and equal 0% and 100% frames. Static rendering without animation is also compliant.

#### Scenario: Drift
- **WHEN** the keyframes and `animation` declarations are read
- **THEN** keyframes change only `transform`, rotate at most 3deg, 0% equals 100%, and every animation lasts 30s to 60s

### Requirement: Reduced motion
Under `@media (prefers-reduced-motion: reduce)`, every `.archive-*` element SHALL have `animation: none`, and the documents and veil SHALL stay visible at rest (opacity and display unchanged).

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** no `.archive-*` element animates and the static backdrop is still shown

### Requirement: Narrow viewports
Under `@media (max-width: 640px)`, at most 3 `.archive-doc` elements SHALL remain displayed (the others `display: none`), and documents SHALL be positioned with logical or symmetric offsets so the RTL (`ar`) layout shows no overflow or clipping of real UI.

#### Scenario: Phone width
- **WHEN** the viewport is 640px wide or less
- **THEN** documents 4 to 6 are hidden and offsets use `inset-inline-*`

### Requirement: No UI alteration and no dependencies
No existing stylesheet, history markup inside `.view`, copy, i18n catalog or behaviour SHALL change. No animation, SVG or styling library SHALL be added.

#### Scenario: Untouched UI
- **WHEN** the change is applied
- **THEN** no rule in `archive-bg.css` targets history, filter or export elements and `package.json` dependencies are unchanged
