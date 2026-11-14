## MODIFIED Requirements

### Requirement: Settings screen
`/settings` SHALL render an `<h1>` "Settings & Methodology", the tabs (Interface & Language, Analyzers & Ensembles, Accessibility, Epistemic Framework, Data Retention) wrapped in `Mock`, the analyzers block, the "View edge-case states →" link to `/states` and the "Return to Analyze" link to `/`. It SHALL NOT render a language block, fake select, "Recommended" badge or `role="switch"` element.

#### Scenario: Mock settings
- **WHEN** `/settings` is rendered
- **THEN** the tabs are inside a mock element, and no language block or `role="switch"` element is present

### Requirement: Settings mock under every locale
The Settings tabs SHALL keep their `Mock` wrapper in every locale; only their text is translated, and no locale SHALL render the removed language block.

#### Scenario: French Settings stays mock
- **WHEN** the locale is `fr` and `/settings` is rendered
- **THEN** it shows "Paramètres et méthodologie", the "Conservation des données" tab inside a mock element, the "Analyseurs IA et ensembles actifs" region, and no "Langue de l’interface" text or switch
