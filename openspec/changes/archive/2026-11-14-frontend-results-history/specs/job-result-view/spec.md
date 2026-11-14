## MODIFIED Requirements

### Requirement: Routing
The job result view (highlighted text, technique list, why region, notes and LLM-assessed group) SHALL be rendered by the router inside the Detail screen for `/jobs/:id/detail`. `/?job=<id>` with a non-empty id SHALL be redirected to `/jobs/<id>` (ui-design-foundation, Legacy job link); with an empty or missing `job` parameter the Home view is rendered.

#### Scenario: Job parameter
- **WHEN** the URL is `/jobs/abc/detail`
- **THEN** the job result view is rendered for id `abc` and requests `/api/v1/jobs/abc`

#### Scenario: Legacy parameter
- **WHEN** the URL is `/?job=abc`
- **THEN** the URL is replaced by `/jobs/abc` and the Results screen is rendered, which links to `/jobs/abc/detail`

#### Scenario: No job parameter
- **WHEN** the URL has no `job` parameter or `job=` is empty
- **THEN** the Home view is rendered
