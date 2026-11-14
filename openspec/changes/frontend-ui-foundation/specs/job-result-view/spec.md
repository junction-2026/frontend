## MODIFIED Requirements

### Requirement: Routing
The job result view SHALL be rendered by the router for `/jobs/:id` (Results). `/?job=<id>` with a non-empty id SHALL be redirected to `/jobs/<id>` (ui-design-foundation, Legacy job link); with an empty or missing `job` parameter the Home view is rendered.

#### Scenario: Job parameter
- **WHEN** the URL is `/jobs/abc`
- **THEN** the job result view is rendered for id `abc` and requests `/api/v1/jobs/abc`

#### Scenario: Legacy parameter
- **WHEN** the URL is `/?job=abc`
- **THEN** the URL is replaced by `/jobs/abc` and the job result view is rendered

#### Scenario: No job parameter
- **WHEN** the URL has no `job` parameter or `job=` is empty
- **THEN** the Home view is rendered
