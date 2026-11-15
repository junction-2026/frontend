## MODIFIED Requirements

### Requirement: Routing
The job result view SHALL be rendered inside the expanded detailed region of `/jobs/:id`. A URL `/jobs/<id>/detail` SHALL be replaced via `history.replaceState` with `/jobs/<id>` before the route is read, on initial load, on `navigate()` and on `popstate`, and the Results screen SHALL be rendered. `/?job=<id>` with a non-empty id SHALL be redirected to `/jobs/<id>` (ui-design-foundation, Legacy job link); with an empty or missing `job` parameter the Home view is rendered.

#### Scenario: Job parameter
- **WHEN** the URL is `/jobs/abc` and the detailed region is expanded
- **THEN** the job result view is rendered for id `abc` and requests `/api/v1/jobs/abc`

#### Scenario: Old detail URL
- **WHEN** the URL is `/jobs/abc/detail`
- **THEN** it is replaced by `/jobs/abc` and the Results screen is rendered

#### Scenario: Old detail URL details
- **WHEN** the URL is `/jobs/a%20b/detail/?x=1`
- **THEN** it is replaced by `/jobs/a%20b?x=1` (id segment unchanged, query kept) and Results is rendered for id `a b`

#### Scenario: Legacy parameter
- **WHEN** the URL is `/?job=abc`
- **THEN** the URL is replaced by `/jobs/abc` and the Results screen is rendered

#### Scenario: No job parameter
- **WHEN** the URL has no `job` parameter or `job=` is empty
- **THEN** the Home view is rendered

### Requirement: Risk score section placement
The Results screen SHALL NOT render a risk section in `.results-stack`; the verdict card SHALL be its first item. The DetailedAnalysis body in the detailed region of `/jobs/:id` SHALL render the risk overview directly after the technique-list card and before the LLM-assessed group when `Job.risk` is a non-null object, and nothing (no error) when it is null or missing. Reads shared `manipulation-risk-score` (shared-specs@18e157ddd9d020aeb9af984d337bf47f5c970659).

#### Scenario: Job with a risk score
- **WHEN** the job has `risk` with `status: "scored"` and the detailed analysis is shown
- **THEN** the risk overview follows the technique-list card and precedes the LLM-assessed group, and no risk section is in the results stack

#### Scenario: Job without a risk score
- **WHEN** `risk` is null or the member is missing
- **THEN** no risk overview is rendered and no error is shown
