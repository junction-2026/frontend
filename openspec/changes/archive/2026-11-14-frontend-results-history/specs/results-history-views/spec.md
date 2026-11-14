## Purpose
Defines the Results, Detailed analysis and History screens of the frontend: what they fetch from the analysis jobs API, how verdicts, finalization, job states, coverage and analyzer outcomes are presented, and which parts are marked as mock.

## ADDED Requirements

### Requirement: Results fetching and meta row
The Results screen (`/jobs/:id`) SHALL fetch `getJob` and, while `done` is false, SHALL poll every 2000 ms and show a "Watch live progress" link to `/jobs/:id/live`. The meta row SHALL show the job id and the duration from `created_at` to `finished_at` (when finished). A model name and a latency SHALL NOT be shown as real values.

#### Scenario: Running job
- **WHEN** the first response has `done: false`
- **THEN** a "Watch live progress" link to `/jobs/j1/live` is shown and a second request follows after 2000 ms

#### Scenario: Finished job
- **WHEN** the job is done with `created_at` and `finished_at` 3.2 s apart
- **THEN** the meta row shows the job id and the duration and no "Model:" text

### Requirement: Verdict card
The verdict card SHALL show a pill from `finalization.result.verdict`: `detected` "Manipulation detected" (orange), `not_detected` "No manipulation indicators" (green), `uncertain` or any unknown value "Uncertain" (purple). The headline SHALL be `finalization.result.user_text` as a plain text node (no HTML, Markdown or links); a result with `produced_by` `orchestrator` SHALL be labelled "Insufficient evidence". Confidence and scores SHALL NOT be displayed as numbers or percentages.

#### Scenario: Detected
- **WHEN** the verdict is `detected` and `confidence` is `0.86`
- **THEN** the pill reads "Manipulation detected" and no `0.86` or `86%` is shown

#### Scenario: Unknown verdict
- **WHEN** the verdict is `suspicious`
- **THEN** the pill reads "Uncertain"

#### Scenario: Markup in user text
- **WHEN** `user_text` is `<b>fake</b> [click](https://example.com)`
- **THEN** exactly those characters are shown and no `b` or `a` element is created from them

#### Scenario: Insufficient evidence
- **WHEN** `produced_by` is `orchestrator`
- **THEN** the label "Insufficient evidence" is shown with the `user_text`

### Requirement: Finalization states
While `finalization.status` is `pending` or `running` the card SHALL show "Final assessment in progress". For `skipped` it SHALL show the reason: `not_configured` "No final assessment configured", `disabled_by_request` "Final assessment turned off for this job", `cancelled` "Final assessment cancelled". For `failed` it SHALL show "Final assessment failed" with `error.code` (`timeout` as "Timed out"). Analyzer results SHALL remain visible in every state.

#### Scenario: Skipped by request
- **WHEN** finalization is `skipped` with `reason: disabled_by_request`
- **THEN** "Final assessment turned off for this job" is shown with the coverage section

#### Scenario: Finalization timed out
- **WHEN** finalization is `failed` with `error.code: timeout`
- **THEN** "Final assessment failed" and "Timed out" are shown and the job is not shown as failed

### Requirement: Technique tags
The Results screen SHALL show one tag per detected technique of the `succeeded` `techniques` run, labelled `plain_language.name` falling back to `display`, without a score. Optional members (`strength`, `located`, `margin`, `summary`) SHALL be ignored or used only when present; none SHALL be required.

#### Scenario: Tags without scores
- **WHEN** the run detected `Loaded_Language` with `score: 0.91`
- **THEN** one tag "Loaded Language" is shown and no `0.91` or `91%`

### Requirement: Job states
A job with `status: failed` and `scrape.status: failed` SHALL show a scrape error card with `scrape.error.code` and `message` as plain text; any other `failed` job SHALL show "Analysis failed". `cancelled` SHALL show "Cancelled" and keep the settled analyzer runs. An unknown status SHALL be treated by `done`. A failed or timed-out analyzer SHALL NOT make the job appear failed.

#### Scenario: Failed scrape
- **WHEN** the job is `failed` and `scrape.error` is `{"code": "account_private", "message": "Account is private"}`
- **THEN** the scrape error card shows `account_private` and `Account is private`

#### Scenario: Analyzer failure only
- **WHEN** one analyzer is `failed` and the job is `completed`
- **THEN** "Analysis failed" is not shown

### Requirement: Coverage and analyzer outcomes
A section SHALL show `coverage` as `succeeded`, `failed` and `skipped` of `applicable` with a bar sized by `settled / total`, and one row per AnalyzerRun with its name, a status pill and its `note`. A `failed` run with `error.code` `timeout` SHALL read "Timed out". A run whose `availability` is not `ran`, `not_applicable` or null SHALL be presented as unavailable. Runs `skipped` with reason `disabled` or `not_selected` SHALL be collapsed under "Not run".

#### Scenario: Timed-out analyzer
- **WHEN** a run is `failed` with `error.code: timeout`
- **THEN** its row shows "Timed out"

#### Scenario: Unknown availability
- **WHEN** a run has `availability: "partial"`
- **THEN** its row shows "Unavailable"

#### Scenario: Collapsed runs
- **WHEN** two runs are `skipped` with `not_selected` and `disabled`
- **THEN** they are listed only inside a "Not run" disclosure

### Requirement: Mock-only parts of Results
The "Polarity / Intensity" signal row, "High rhetorical bias factor", the Share button and the Ask VEIL call to action SHALL be wrapped in `Mock`. Copy SHALL copy the page URL to the clipboard without `Mock`. "Explore full analysis" SHALL link to `/jobs/:id/detail` and "Cross-source coverage" to `/explore`.

#### Scenario: Copy
- **WHEN** the user presses Copy
- **THEN** `navigator.clipboard.writeText` receives the page URL and Copy has no `Mock` ancestor

### Requirement: Detail metrics
The Detail screen (`/jobs/:id/detail`) SHALL show a metrics bar with Patterns, the number of detected techniques of the `succeeded` `techniques` run (otherwise "—"), and Claims, the number of `claims` of a `succeeded` `topic_extraction` run (otherwise "—"). Confidence SHALL NOT be shown; Risk and Latency SHALL be wrapped in `Mock`. Technique entries SHALL show `Detection.name` as ID badge and no match percentage.

#### Scenario: Metrics
- **WHEN** two techniques were detected and `topic_extraction` succeeded with three claims
- **THEN** Patterns shows 2, Claims shows 3 and no confidence is shown

#### Scenario: Claims unavailable
- **WHEN** `topic_extraction` failed
- **THEN** Claims shows "—"

### Requirement: History listing and filters
The History screen (`/history`) SHALL call `listJobs` with `limit` 20, show items in the returned order (newest first) and, while `next_cursor` is non-null, a "Load more" button that appends the next page. The filter chips All, Running, Completed, Failed and Cancelled SHALL set `?status=` (All omits it) and reset pagination. No counts SHALL be shown. Items SHALL be grouped by local day ("Today", "Yesterday", the date) with the number of loaded items in the group.

#### Scenario: Pagination
- **WHEN** the first page has `next_cursor: "c1"` and the user presses "Load more"
- **THEN** the next request has `cursor=c1` and its items are appended; with `next_cursor: null` the button is absent

#### Scenario: Status filter
- **WHEN** the user selects Failed
- **THEN** the list is requested with `status=failed` and without a cursor

### Requirement: History items
Each item SHALL show the job id, a status pill, a verdict tag from `finalization.verdict` (null shows the finalization status), the relative time from `created_at` and a "Reopen Analysis →" link to `/jobs/{id}`.

#### Scenario: Item without verdict
- **WHEN** `finalization.verdict` is null and `finalization.status` is `pending`
- **THEN** the item shows the finalization status instead of a verdict tag

### Requirement: History excerpts
Each item SHALL show an excerpt fetched with `getJob` per loaded item, with at most 4 requests in flight: the first 140 characters of `input.content`, or of `scrape.url` when there is no input, as plain text, or "Excerpt unavailable" when the request fails.

#### Scenario: Excerpt failure
- **WHEN** `getJob` for an item fails
- **THEN** the item shows "Excerpt unavailable" and the other items are unaffected

#### Scenario: Concurrency
- **WHEN** ten items are loaded
- **THEN** never more than four `getJob` requests are pending at once

### Requirement: History mock parts
The search box, the "Export Ledger" button and the texts "Synchronized" and "Workspace session local" SHALL be wrapped in `Mock`; the search input SHALL be disabled.

#### Scenario: Search is a mock
- **WHEN** the History screen is shown
- **THEN** the search box has a `Mock` ancestor and is disabled, and the job items have none

### Requirement: Loading, empty, error and not-found states
Loading SHALL show a skeleton with `role="status"`. An empty history SHALL show "No previous analyses yet" with a "Start first analysis" link to `/`. Error envelopes SHALL be shown with `role="alert"` using the foundation message mapping. A 404 on a job SHALL show "Job not found" and stop polling.

#### Scenario: Not found
- **WHEN** `getJob` answers 404
- **THEN** "Job not found" is shown with `role="alert"` and no further request is sent

#### Scenario: Empty history
- **WHEN** `listJobs` returns no items
- **THEN** "No previous analyses yet" and a "Start first analysis" link to `/` are shown
