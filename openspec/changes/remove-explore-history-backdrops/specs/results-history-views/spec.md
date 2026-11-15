## ADDED Requirements

### Requirement: History solid background
`HistoryView` SHALL render no decorative backdrop layer (no `.archive-bg`, no inline bookshelf SVG, no scrim) in any state (loading, loaded, empty, error), so the page shows the body's solid `var(--bg)`. It SHALL NOT render `.ambient-bg`; the ambient background stays `HomeView`-only and unchanged.

#### Scenario: All states
- **WHEN** `HistoryView` is rendered while loading, loaded, empty and in error
- **THEN** `section.view` is its only top-level element, and no `.archive-bg`, `.ambient-bg`, `<canvas>` or decorative `<svg>` exists outside it

### Requirement: History stacking and contrast
Removing the former `.archive-bg + .view` rule SHALL NOT change the visible stacking of the sticky topbar or the hosting badge relative to the page content. Body text on History SHALL keep at least 4.5:1 contrast against `var(--bg)`.

#### Scenario: Chrome keeps stacking
- **WHEN** the History page is scrolled
- **THEN** the sticky topbar and the hosting badge stay above the page content

## REMOVED Requirements

### Requirement: History backdrop mounting
**Reason**: The bookshelf backdrop was dropped per project#104; replaced by "History solid background".
**Migration**: None; `HistoryView` renders only `section.view` and the page uses the body's solid background.
