## MODIFIED Requirements

### Requirement: Routing
A dependency-free History-API router SHALL map `/` to Home, `/jobs/:id/live` to Analyzing, `/jobs/:id` to Results, `/jobs/:id/detail` to Detail, `/jobs/:id/ask` to Ask (with the id), `/history`, `/explore`, `/explore/region`, `/ask` (no job), `/settings` and `/states` to their views. An unknown path SHALL render Home. Links SHALL be `<a href>` elements whose plain left clicks are intercepted for client navigation, and every navigation SHALL scroll to the top.

#### Scenario: Known route
- **WHEN** the path is `/jobs/abc/detail`
- **THEN** the Detail view is rendered inside the shell with job id `abc`

#### Scenario: Ask route
- **WHEN** the path is `/jobs/abc/ask`
- **THEN** the Ask view is rendered for job `abc`

#### Scenario: Unknown route
- **WHEN** the path is `/nope`
- **THEN** the Home view is rendered

#### Scenario: Client navigation
- **WHEN** the user clicks a link to `/history`
- **THEN** the URL changes without a reload, the History view is shown and the window is scrolled to the top
