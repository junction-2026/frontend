## RENAMED Requirements
- FROM: `### Requirement: Settings and Region without literals`
- TO: `### Requirement: Region without literals`

## MODIFIED Requirements

### Requirement: Secondary screens localization
All fixed text of Explore (including the world map labels, tooltip and legend), Region and Ask SHALL come from the `explore` and `ask` catalogs in the active locale; every English text quoted in this capability is the `en` catalog value. API-provided strings (article titles, API error messages) SHALL NOT be translated. Switching language SHALL re-render these screens without reload.

#### Scenario: Finnish Explore
- **WHEN** the locale is `fi` and `/explore` is rendered
- **THEN** the heading, the map label and the legend are Finnish

### Requirement: Secondary screens right-to-left layout
`secondary.css` SHALL use logical properties so the screens mirror under `dir=rtl`; the map SVG SHALL NOT be mirrored.

#### Scenario: Arabic Settings
- **WHEN** the locale is `ar` and `/settings` is requested
- **THEN** Home is rendered (the page no longer exists) with the document direction rtl

#### Scenario: Arabic Region
- **WHEN** the locale is `ar` and `/explore/region` is rendered
- **THEN** the document direction is rtl and the labels are Arabic

### Requirement: Region without literals
The Region mock (stat cards, wire sources, tags) SHALL take every static string, including proper-noun outlet names, from the catalogs in all six locales. Percentages and outlet names SHALL be isolated with `<bdi>`. Directional glyphs (↗, ⌕) SHALL mirror under `[dir=rtl]`.

#### Scenario: Settings in Arabic
- **WHEN** `/settings` is requested in ar
- **THEN** Home is rendered with dir rtl and no Settings text

#### Scenario: Region in Arabic
- **WHEN** Region is rendered in ar
- **THEN** dir is rtl and no static Latin-script text other than the brand appears

## REMOVED Requirements

### Requirement: Settings screen
**Reason**: The Settings & Methodology page is removed; the analyzer list lives in the Analyze Advanced options panel.
**Migration**: Use the Advanced options panel on Home (`analyze-flow-ui`).

### Requirement: Settings analyzers block
**Reason**: The block moved into the Advanced options panel.
**Migration**: See `analyze-flow-ui` "Advanced options summary".

### Requirement: Settings analyzer rows
**Reason**: Rows moved into the Advanced options panel.
**Migration**: See `analyze-flow-ui` "Advanced options panel" and "Always-on analyzers".

### Requirement: Settings analyzers tolerant reader
**Reason**: The tolerant reader now applies to the Advanced options panel.
**Migration**: See `analyze-flow-ui` "Advanced options states".

### Requirement: Settings analyzers states
**Reason**: The states now apply to the Advanced options panel.
**Migration**: See `analyze-flow-ui` "Advanced options states" and "Advanced options summary".

### Requirement: Settings mock under every locale
**Reason**: The Settings tabs mock is removed with the page.
**Migration**: None.
