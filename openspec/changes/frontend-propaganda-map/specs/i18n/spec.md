## ADDED Requirements

### Requirement: Propaganda map strings
Every string of the global propaganda map SHALL be a key in the `explore` namespace of en, fr, ar, de, fi and ru, with the plural forms of each locale for counted phrases. The i18n runtime SHALL NOT change.

#### Scenario: Catalog completeness
- **WHEN** the catalog completeness test runs
- **THEN** every new `explore` key exists in all six locales with matching placeholders
