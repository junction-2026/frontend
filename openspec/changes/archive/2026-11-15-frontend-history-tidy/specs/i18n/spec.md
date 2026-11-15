## ADDED Requirements

### Requirement: History catalog keys for search and export
All catalogs (ar, de, en, fi, fr, ru) SHALL NOT contain the keys `history.ledger`, `history.session`, `history.session_scope`, `history.synchronized`, `history.sync_state`, `history.export_label` and `history.search_label`, and SHALL contain `history.empty.search` (with the placeholder `{query}`), `history.exporting` and `history.export_hint`. The key-completeness test SHALL pass. The CSV header names of the History export are fixed machine names and SHALL NOT be translated.

#### Scenario: Complete catalogs
- **WHEN** the key-completeness test runs
- **THEN** every locale has the same History keys and placeholders as en
