## ADDED Requirements

### Requirement: Explore solid background
`ExploreView` SHALL render no decorative backdrop layer (no `.explore-veil`, no `<canvas>`, no fixed or absolute decorative element) in either mode (with and without a job id), so the page shows the body's solid `var(--bg)` with no gradient, image, pattern, animation, WebGL or canvas. It SHALL NOT render `.ambient-bg`; the ambient background stays `HomeView`-only and unchanged.

#### Scenario: Both modes
- **WHEN** `ExploreView` is rendered with and without a job id
- **THEN** `section.view` is its only top-level element, and no `.explore-veil`, `.ambient-bg`, `<canvas>` or decorative `<svg>` exists outside it

### Requirement: Explore stacking and contrast
Removing the former `.explore-veil + .view` rule SHALL NOT change the visible stacking of the sticky topbar, the hosting badge, the map tooltip or the country panel relative to the page content. Body text on Explore SHALL keep at least 4.5:1 contrast against `var(--bg)`.

#### Scenario: Overlays keep stacking
- **WHEN** the map tooltip or the country panel is shown
- **THEN** it renders above the map, and the sticky topbar and the hosting badge stay above the page content

### Requirement: Backdrop test coverage
`ExploreView` and `HistoryView` tests SHALL assert in every mode or state that no `.explore-veil`, `.archive-bg`, `.ambient-bg` or `<canvas>` backdrop is rendered. Tests for the removed components and stylesheets SHALL be deleted with them.

#### Scenario: Tests present
- **WHEN** the unit tests run
- **THEN** the Explore (both modes) and History (loading, loaded, empty, error) tests pass with those assertions
