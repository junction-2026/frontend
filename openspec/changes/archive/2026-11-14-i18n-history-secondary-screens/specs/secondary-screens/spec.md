## ADDED Requirements
### Requirement: Secondary screens localization
All fixed text of Explore (including the world map labels, tooltip and legend), Region, Ask and Settings (including the analyzers block) SHALL come from the `explore`, `ask` and `settings` catalogs in the active locale; every English text quoted in this capability is the `en` catalog value. API-provided strings (analyzer names and categories, article titles, API error messages) SHALL NOT be translated. Switching language SHALL re-render these screens without reload.

#### Scenario: Finnish Explore
- **WHEN** the locale is `fi` and `/explore` is rendered
- **THEN** the heading, the map label and the legend are Finnish

### Requirement: Localized country names and numbers
Country names SHALL be shown with `Intl.DisplayNames` (region) in the active locale and fall back to the previously used English name. Numbers of the Region mock dataset SHALL be formatted with the active locale.

#### Scenario: German Region
- **WHEN** the locale is `de` and `/explore/region` is rendered
- **THEN** the selected region reads "Finnland" and the index coverage reads "99,1 %"

### Requirement: Settings mock under every locale
The Settings tabs and the "Interface & analysis language" block SHALL keep their `Mock` wrapper and `aria-disabled="true"` toggle in every locale; only their text is translated.

#### Scenario: French Settings stays mock
- **WHEN** the locale is `fr` and the user clicks the language toggle on `/settings`
- **THEN** the labels are French, the toggle keeps `aria-checked="true"` and `aria-disabled="true"` and the block is inside a mock element

### Requirement: Secondary screens right-to-left layout
`secondary.css` SHALL use logical properties so the screens mirror under `dir=rtl`; the map SVG SHALL NOT be mirrored.

#### Scenario: Arabic Settings
- **WHEN** the locale is `ar`
- **THEN** the document direction is rtl and the analyzer rows show Arabic labels
