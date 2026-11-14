## MODIFIED Requirements
### Requirement: Home copy and mock marking
The support note SHALL read "Supports Bluesky, Mastodon and web pages". The `Auto-detect (EN, FR, AR, DE, FI)` chip and the two feature cards ("Unbiased Dissection", "Provenance & Signals") SHALL be wrapped in `Mock`. Home SHALL NOT render a "Private by Architecture" card. The `Try:` sample buttons SHALL fill the textarea and SHALL NOT be marked.

#### Scenario: Marked and unmarked elements
- **WHEN** Home renders
- **THEN** the chip and each feature card are inside `[data-mock]`, the sample buttons, count and support note are not, and no "Private by Architecture" text is present

## ADDED Requirements
### Requirement: Home feature grid layout
The Home feature row SHALL lay out its cards in as many equal-width columns as there are cards (two) above 960px viewport width, with no empty grid track, and in a single column at 960px and below.

#### Scenario: Wide viewport
- **WHEN** the viewport is wider than 960px
- **THEN** the two cards fill two equal columns
