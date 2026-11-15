# hosting-badge Specification

## Purpose
Defines the small fixed "Powered by Hostinger" credit with the Hostinger emblem that the frontend shows in the bottom-right corner on desktop-width screens.

## Requirements

### Requirement: Badge component and mount
`src/ui/HostingerBadge.tsx` SHALL render `<a class="hosting-badge" href="https://www.hostinger.com" target="_blank" rel="noopener noreferrer">` containing an `<img>` with `alt=""`, `aria-hidden="true"` and `width`/`height` matching the asset's aspect ratio, followed by a `<span>` with `t('credits.powered_by')`. `Shell` SHALL render it once as the last child of `.app-shell`, after `{children}` and outside `header.topbar`. The top bar contents SHALL be unchanged.

#### Scenario: One named link on every route
- **WHEN** the app renders any route in `en`
- **THEN** exactly one link named "Powered by Hostinger" exists, with `target="_blank"` and a `rel` containing `noopener` and `noreferrer`

### Requirement: Emblem asset
The emblem SHALL be the Hostinger SVG stored at `src/assets/hostinger-emblem.svg`, imported through Vite, with no runtime request to hostinger.com for the image. Its source, download date, colour and applied guidelines SHALL be recorded in `docs/third-party-assets.md`. The emblem SHALL NOT be stretched, rotated, recoloured at runtime or given effects, and SHALL keep clear space of at least 25% of its height.

#### Scenario: Image is self-hosted
- **WHEN** the badge renders
- **THEN** the `img` has `alt=""` and a `src` that is the bundled emblem asset

### Requirement: Placement and visibility
`.hosting-badge` SHALL use `position: fixed`, `inset-block-end: 12px`, `inset-inline-end: 12px` and `z-index: 30`, with logical properties only (no physical `left`/`right`). It SHALL be `display: none` by default and `display: inline-flex` inside `@media (min-width: 961px)`. At that width `.app-shell` SHALL have `padding-block-end` of at least 64px. The badge box SHALL be only its link.

#### Scenario: Desktop vs small screens
- **WHEN** the viewport is at least 961px wide
- **THEN** the badge is shown fixed in the inline-end, block-end corner; at 960px or less it is not displayed and not in the accessibility tree

### Requirement: Size, contrast and focus
The badge text SHALL be `font-size: 0.75rem`, `font-weight: 500`, `line-height: 1.2`, `white-space: nowrap`, with colour `var(--ink-2)` on `var(--surface)` (at least 4.5:1). The emblem SHALL be 16-20px tall. The badge SHALL be at most 40px tall and 240px wide in `en`. The link SHALL show a `:focus-visible` outline of at least 2px. The badge SHALL have no animation or transition other than colour changes.

#### Scenario: Readable and focusable
- **WHEN** the link receives keyboard focus
- **THEN** a 2px outline is visible

### Requirement: Credits catalog
A `credits` namespace with key `powered_by` SHALL exist in en, fr, ar, de, fi and ru, with the brand name in the `{brand}` placeholder rendered in a `<bdi>` through `rich()`; the name "Hostinger" SHALL stay in Latin script. The `shell` catalog SHALL NOT be changed by this change.

#### Scenario: Arabic keeps the brand isolated
- **WHEN** the locale is `ar`
- **THEN** the text is "مدعوم من Hostinger" and "Hostinger" sits inside a `bdi` element
