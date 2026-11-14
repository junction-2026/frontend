## ADDED Requirements

### Requirement: Ask, Settings and Region without literals
The Ask mock thread (questions, answers, outlet names, chips, suggestions, aria-labels, placeholder), the Settings screen and the Region mock (stat cards, wire sources, tags) SHALL take every static string, including proper-noun outlet names, from the catalogs in all five locales. Percentages and outlet names SHALL be isolated with `<bdi>`. Directional glyphs (↗, ⌕) SHALL mirror under `[dir=rtl]`.

#### Scenario: Settings in Arabic
- **WHEN** Settings is rendered in ar
- **THEN** dir is rtl and no static Latin-script text other than the brand and analyzer ids from the API appears

#### Scenario: Ask outlets in Arabic
- **WHEN** Ask is rendered in ar
- **THEN** the answer names the outlets in Arabic script
