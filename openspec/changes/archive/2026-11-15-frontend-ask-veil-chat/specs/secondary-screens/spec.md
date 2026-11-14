## REMOVED Requirements

### Requirement: Ask screen
**Reason**: The Ask screen is no longer a mock; it is specified by the `ask-chat` capability.
**Migration**: See `ask-chat` (Ask route, Thread rendering, Composer, Chat request).

### Requirement: Ask, Settings and Region without literals
**Reason**: The Ask mock thread no longer exists; the Settings and Region part is kept by the requirement below.
**Migration**: See `ask-chat` "Ask copy in every locale".

## ADDED Requirements

### Requirement: Settings and Region without literals
The Settings screen and the Region mock (stat cards, wire sources, tags) SHALL take every static string, including proper-noun outlet names, from the catalogs in all five locales. Percentages and outlet names SHALL be isolated with `<bdi>`. Directional glyphs (↗, ⌕) SHALL mirror under `[dir=rtl]`.

#### Scenario: Settings in Arabic
- **WHEN** Settings is rendered in ar
- **THEN** dir is rtl and no static Latin-script text other than the brand and analyzer ids from the API appears
