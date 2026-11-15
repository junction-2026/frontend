## MODIFIED Requirements

### Requirement: Routing
A dependency-free History-API router SHALL map `/` to Home, `/jobs/:id/live` to Analyzing, `/jobs/:id` to Results, `/jobs/:id/ask` to Ask, `/history`, `/explore`, `/explore/region`, `/ask` and `/states` to their views. It SHALL NOT map `/settings`, and `RouteName` and `navFor` SHALL have no settings case. An unknown path SHALL render Home. Plain left clicks on links SHALL navigate client-side and scroll to the top.

#### Scenario: Known route
- **WHEN** the path is `/jobs/abc`
- **THEN** the Results view is rendered inside the shell with job id `abc`

#### Scenario: Old detail URL
- **WHEN** the path is `/jobs/abc/detail`
- **THEN** the URL is replaced by `/jobs/abc` and the Results view is rendered; the router has no Detail route

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

### Requirement: Mock areas register
`docs/mock-areas.md` SHALL list every marked mock area by route and element; each screen task appends its rows. The top-bar language selector is functional and SHALL NOT be marked mock or listed. The register SHALL have no row for the `/jobs/:id` detailed-region items "Polarity / Intensity", "High rhetorical bias factor" and Share (removed from the screen), and none for the detailed-region metrics bar (Risk and Latency are real).

#### Scenario: Language selector not listed
- **WHEN** a reader opens `docs/mock-areas.md`
- **THEN** it has no row for the top-bar language selector or the Home language chip

#### Scenario: Removed Results items not listed
- **WHEN** a reader opens `docs/mock-areas.md`
- **THEN** it has no row for Polarity / Intensity, the bias factor, the Share button or the detailed-region metrics bar
