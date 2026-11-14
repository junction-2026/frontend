## MODIFIED Requirements

### Requirement: Shell and navigation
The top bar SHALL show the brand link to `/`, the nav Analyze, Explore, History (no count), the functional language selector (not wrapped in `Mock`), "+ New Analysis" to `/` and an account button to `/settings`, with texts from the active locale. The active nav item is Analyze for `/`, `/jobs/*`, `/ask`, `/states`; Explore for `/explore*`; History for `/history`, with `aria-current="page"`.

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

## ADDED Requirements

### Requirement: Product brand
The document `<title>` SHALL be "Stiriri / Intelligence". The top-bar brand link SHALL read "Stiriri" followed by the translated brand subtitle ("Intelligence" in `en`) and point to `/`. The brand name "Stiriri" SHALL NOT be translated in any locale.

#### Scenario: Brand in en
- **WHEN** the app is shown in `en`
- **THEN** the document title is "Stiriri / Intelligence" and the banner brand link reads "Stiriri / Intelligence" and points to `/`
