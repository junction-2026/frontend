## ADDED Requirements

### Requirement: History language catalog keys
All catalogs (ar, de, en, fi, fr, ru) SHALL contain the keys `history.language.label`, `history.language.all`, `history.language.unknown`, `history.language.item` (with the placeholder `{language}`), `history.empty.language` and `history.clear_filters`, and the language filter SHALL add no keys outside the `history` namespace. The key-completeness test SHALL pass.

#### Scenario: Complete catalogs
- **WHEN** the key-completeness test runs
- **THEN** every locale has the same History keys and placeholders as en
