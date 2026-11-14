## ADDED Requirements

### Requirement: Visibility catalog keys
The catalogs SHALL include the keys `compose.visibility.label` and `compose.visibility.hint` in en, fr, ar, de and fi, covered by the key-completeness test.

#### Scenario: Keys in every locale
- **WHEN** the completeness test runs
- **THEN** every locale has non-empty `compose.visibility.label` and `compose.visibility.hint`
