## MODIFIED Requirements
### Requirement: Shell and navigation
The top bar SHALL show the brand link to `/`, the nav Analyze, Explore, History (no count), the functional language selector (not wrapped in `Mock`), "+ New Analysis" to `/` and an account button to `/settings`, with texts from the active locale ("VEIL" is not translated). The active nav item is Analyze for `/`, `/jobs/*`, `/ask`, `/states`; Explore for `/explore*`; History for `/history`, with `aria-current="page"`.

#### Scenario: Active state
- **WHEN** the path is `/explore/region`
- **THEN** only the Explore nav item is active

#### Scenario: Job path
- **WHEN** the path is `/jobs/abc`
- **THEN** only the Analyze nav item is active

#### Scenario: Selector markup
- **WHEN** the top bar renders
- **THEN** a native `<select class="lang-select">` named "Language" lists English, Français, العربية, Deutsch, Suomi with `lang` attributes and the active locale as value

#### Scenario: Language selector
- **WHEN** the user picks Deutsch in the selector
- **THEN** the nav reads "Analysieren", "Entdecken", "Verlauf" without a reload

## REMOVED Requirements
### Requirement: Mock register
**Reason**: It required the top-bar language selector to be marked mock and listed; the selector is now functional.
**Migration**: Replaced by "Mock areas register".

## ADDED Requirements
### Requirement: Mock areas register
`docs/mock-areas.md` SHALL list every marked mock area by route and element; each screen task appends its rows. The top-bar language selector is functional and SHALL NOT be marked mock or listed.

#### Scenario: Language selector not listed
- **WHEN** a reader opens `docs/mock-areas.md`
- **THEN** it has no row for the top-bar language selector or the Home language chip
