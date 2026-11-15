## MODIFIED Requirements
### Requirement: Shell and navigation
The top bar SHALL show the brand link to `/`, the nav Analyze, Explore, History (no count), the functional language selector (not wrapped in `Mock`) and an account button to `/settings`, with texts from the active locale; it SHALL NOT show a "+ New Analysis" button. The active nav item is Analyze for `/`, `/jobs/*`, `/ask`, `/states`; Explore for `/explore*`; History for `/history`, with `aria-current="page"`.

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

#### Scenario: No New Analysis button
- **WHEN** any route is rendered in any locale
- **THEN** the top bar contains no link or button with the text of the former `shell.new_analysis` key, and the brand link and the Analyze nav item link to `/`
