## ADDED Requirements
### Requirement: No New Analysis shell key
The `shell` namespace SHALL NOT define `new_analysis` in any locale (en, de, fi, fr, ar, ru); the catalog-parity test continues to pass.

#### Scenario: Key removed
- **WHEN** the `shell` catalogs of all locales are inspected
- **THEN** none defines `new_analysis`
