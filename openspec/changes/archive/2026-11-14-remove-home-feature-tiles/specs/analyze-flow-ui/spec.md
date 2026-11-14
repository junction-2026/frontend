## MODIFIED Requirements
### Requirement: Home copy and mock marking
The English support note SHALL read "Supports Bluesky, Mastodon and web pages"; all Home copy SHALL come from the active locale's `home` catalog. Home SHALL NOT render a language chip, a "Private by Architecture" card, the feature cards "Unbiased Dissection" or "Provenance & Signals" (or their translations), or a feature-card grid container. The `Try:` sample buttons SHALL fill the textarea and SHALL NOT be marked.

#### Scenario: Marked and unmarked elements
- **WHEN** Home renders
- **THEN** neither feature-card title is present, no `.feature-grid` element exists, the sample buttons, count and support note are not inside `[data-mock]`, the Auto-detect chip is absent, and no "Private by Architecture" text is present

#### Scenario: No feature-card remnants
- **WHEN** the `home` catalogs and analyze.css are inspected
- **THEN** no locale defines `feature_card`, `feature.dissection.*` or `feature.provenance.*`, and analyze.css has no `.feature-grid`, `.feature` or `.feature-icon` rule
