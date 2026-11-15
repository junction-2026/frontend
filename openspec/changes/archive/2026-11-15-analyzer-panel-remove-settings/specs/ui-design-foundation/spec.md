## MODIFIED Requirements

### Requirement: Routing
A dependency-free History-API router SHALL map `/` to Home, `/jobs/:id/live` to Analyzing, `/jobs/:id` to Results, `/jobs/:id/detail` to Detail, `/jobs/:id/ask` to Ask, `/history`, `/explore`, `/explore/region`, `/ask` and `/states` to their views. It SHALL NOT map `/settings`, and `RouteName` and `navFor` SHALL have no settings case. An unknown path SHALL render Home. Plain left clicks on links SHALL navigate client-side and scroll to the top.

#### Scenario: Known route
- **WHEN** the path is `/jobs/abc/detail`
- **THEN** the Detail view is rendered inside the shell with job id `abc`

#### Scenario: Ask route
- **WHEN** the path is `/jobs/abc/ask`
- **THEN** the Ask view is rendered for job `abc`

#### Scenario: Unknown route
- **WHEN** the path is `/nope`
- **THEN** the Home view is rendered

#### Scenario: Settings is gone
- **WHEN** the path is `/settings` or `/settings/x`
- **THEN** the Home view is rendered and the Analyze nav item is active

#### Scenario: States stays routed
- **WHEN** the path is `/states`
- **THEN** the States view is rendered

#### Scenario: Client navigation
- **WHEN** the user clicks a link to `/history`
- **THEN** the URL changes without a reload, the History view is shown and the window is scrolled to the top

### Requirement: Shell and navigation
The top bar SHALL show the brand link to `/`, the nav Analyze, Explore, History (no count), the health indicator, and the functional language selector (not wrapped in `Mock`), with texts from the active locale. It SHALL NOT show a "+ New Analysis" button or an account or avatar link, and keeps its spacing in LTR and RTL at 1440, 768 and 390px. The active nav item is Analyze for `/`, `/jobs/*`, `/ask`, `/states`; Explore for `/explore*`; History for `/history`, with `aria-current="page"`.

#### Scenario: Active state
- **WHEN** the path is `/explore/region`
- **THEN** only the Explore nav item is active

#### Scenario: Job path
- **WHEN** the path is `/jobs/abc`
- **THEN** only the Analyze nav item is active

#### Scenario: No account link
- **WHEN** the top bar renders
- **THEN** no link named "Account" and no link to `/settings` exists, and the `.avatar` styles and the `shell.account` key of every locale are removed

#### Scenario: No New Analysis button
- **WHEN** any route is rendered in any locale
- **THEN** the top bar contains no link or button with the text of the former `shell.new_analysis` key, and the brand link and the Analyze nav item link to `/`

#### Scenario: Selector markup
- **WHEN** the top bar renders
- **THEN** a native `<select class="lang-select">` named "Language" lists English, Français, العربية, Deutsch, Suomi with `lang` attributes and the active locale as value

#### Scenario: Language selector
- **WHEN** the user picks Deutsch in the selector
- **THEN** the nav reads "Analysieren", "Entdecken", "Verlauf" without a reload

### Requirement: Stub views
Each of `src/views/{Home,Analyzing,Results,Detail,History,Explore,Region,Ask,States}View.tsx` SHALL default-export a component rendering its page heading (`h1`), so that routes are testable before the screen tasks replace them.

#### Scenario: Stub heading
- **WHEN** the path is `/history`
- **THEN** an h1 "History" is shown in the shell
