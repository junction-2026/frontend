# analyze-flow-ui Specification

## Purpose
Defines the Home composer that creates analysis jobs and the live analyzing view that follows a job over its event stream, as implemented against shared specs analysis-jobs-api and analysis-job-events.

## Requirements

### Requirement: Composer modes and submission
Home SHALL show a composer with Text and Social Link mode tabs as in the mock. Text mode SHALL send `{"input": {"content": <text>}}` and Social Link mode SHALL send `{"scrape": {"url": <value>}}` to `POST /api/v1/jobs` and, on 201, navigate to `/jobs/{id}/live`. The character count SHALL read `<n> chars`. The Analyze button SHALL be disabled while the content is blank after trimming or a request is in flight. Ctrl+Enter and Cmd+Enter in the textarea SHALL submit.

#### Scenario: Text submission
- **WHEN** the user types "hello" and presses Analyze
- **THEN** `POST /api/v1/jobs` receives `{"input":{"content":"hello"}}` and the app navigates to `/jobs/<id>/live`

#### Scenario: URL submission
- **WHEN** the user selects Social Link, enters `https://bsky.app/profile/a/post/1` and presses Analyze
- **THEN** the body is `{"scrape":{"url":"https://bsky.app/profile/a/post/1"}}`

#### Scenario: Blank content
- **WHEN** the textarea holds only whitespace
- **THEN** the Analyze button is disabled and the count reads `3 chars` for three spaces

#### Scenario: Keyboard submit
- **WHEN** the user presses Ctrl+Enter or Cmd+Enter with content entered
- **THEN** the job is created exactly once

### Requirement: Client checks before sending
In Social Link mode the value SHALL parse as an absolute http(s) URL of at most 2048 characters; otherwise an inline error SHALL be shown and nothing SHALL be sent. Text mode SHALL send any non-blank content.

#### Scenario: Invalid URL
- **WHEN** Social Link mode holds `ftp://x.org/a` or `not a url`
- **THEN** an inline error is shown and no request is made

#### Scenario: Overlong URL
- **WHEN** the URL is longer than 2048 characters
- **THEN** an inline error is shown and no request is made

### Requirement: Advanced options panel
The `Advanced options ▾` control SHALL expand a panel listing the items of `GET /api/v1/analyzers` with `selectable: true` as checkboxes (name, category, and a `disabled` hint when `enabled` is false), all checked by default, plus a `Final assessment` toggle (`options.finalize`, default on). If the analyzers request fails, the panel SHALL show the error.

#### Scenario: Panel content
- **WHEN** the panel opens and the server lists a selectable, a disabled and a non-selectable analyzer
- **THEN** the first two are listed checked (the disabled one with the hint) and the non-selectable one is not listed

### Requirement: Advanced options in the request
When every selectable analyzer is checked the request SHALL omit `analyzers`, otherwise it SHALL carry the checked ids. `options.finalize` SHALL be sent as `false` when the toggle is off. If the analyzers request failed, the job SHALL be sent without `analyzers`.

#### Scenario: All analyzers checked
- **WHEN** nothing was unchecked
- **THEN** the body has no `analyzers` member

#### Scenario: Subset
- **WHEN** one of three analyzers is unchecked
- **THEN** the body has `analyzers` with the two checked ids

#### Scenario: Finalize off
- **WHEN** the Final assessment toggle is switched off
- **THEN** the body has `options: {"finalize": false}`

#### Scenario: Analyzers list fails
- **WHEN** `GET /api/v1/analyzers` fails
- **THEN** the panel shows the error and the next submission has no `analyzers` member

### Requirement: Submission errors
A non-201 response SHALL render an element with `role=alert` using the foundation's message mapping. For `validation_failed` each `details.fields` entry SHALL be listed; for `unknown_analyzer` the ids SHALL be listed. The entered content SHALL be kept.

#### Scenario: Validation failed
- **WHEN** the server answers 422 `validation_failed` with fields `scrape.url` and `input`
- **THEN** an alert lists both field entries and the textarea keeps its value

#### Scenario: Payload too large
- **WHEN** the server answers 413 `payload_too_large`
- **THEN** the alert reads "Content is larger than 1 MiB"

#### Scenario: Unknown analyzer
- **WHEN** the server answers 422 `unknown_analyzer` with `details.analyzer_ids: ["nope"]`
- **THEN** the alert lists `nope`

### Requirement: Home copy and mock marking
The support note SHALL read "Supports Bluesky, Mastodon and web pages". The `Auto-detect (EN, FR, AR, DE, FI)` chip and the two feature cards ("Unbiased Dissection", "Provenance & Signals") SHALL be wrapped in `Mock`. Home SHALL NOT render a "Private by Architecture" card. The `Try:` sample buttons SHALL fill the textarea and SHALL NOT be marked.

#### Scenario: Marked and unmarked elements
- **WHEN** Home renders
- **THEN** the chip and each feature card are inside `[data-mock]`, the sample buttons, count and support note are not, and no "Private by Architecture" text is present

### Requirement: Live view state
The analyzing view at `/jobs/:id/live` SHALL subscribe to the job's events, build its state from `job.snapshot` and later events, and unsubscribe on unmount. The quote banner SHALL show `input.content` (or the scrape URL while `input` is null) as plain text, the job id and the elapsed time computed client-side from `created_at` to `finished_at` or now. `Cluster: eu-west-alpha-2` and `Zero-retention ephemeral pipeline` SHALL be inside `Mock` or removed.

#### Scenario: Scrape job before input
- **WHEN** the snapshot has `input: null` and `scrape.url: https://x.org/a`
- **THEN** the banner shows `https://x.org/a`

#### Scenario: Content is text
- **WHEN** the content is `<img src=x onerror=alert(1)>`
- **THEN** it is shown literally and no element is created from it

### Requirement: Live progress
The progress bar and the text `Stage <done> of <total> completed` SHALL come from the latest Progress (`done`, `total`); an event whose `seq` is not greater than the last applied one SHALL NOT change the state. Before `analysis.planned` the phase text of the scrape Activity SHALL be shown. The mock's worker load and remaining time SHALL NOT be shown as real values.

#### Scenario: Out-of-order progress
- **WHEN** an event with `seq` 7 and progress 3 of 8 is followed by one with `seq` 6 and progress 2 of 8
- **THEN** the view shows `Stage 3 of 8 completed`

#### Scenario: Scrape phase
- **WHEN** `scrape.started` carries an Activity with text "Reading the post" and no plan exists yet
- **THEN** that text is shown

### Requirement: Active Worker Ledger rows
The `Active Worker Ledger` SHALL list one row per PlanEntry in plan order. A row title SHALL be the Activity text, or the PlanEntry `name` before the analyzer started. The detail SHALL be the Activity detail, or for a settled row the analyzer `note`, or the preview counts when a preview exists, all as plain text. The duration SHALL come from `duration_ms`.

#### Scenario: Title before and after start
- **WHEN** a plan entry `news_search` named "News search" has not started and then `analyzer.started` carries the Activity text "Searching news coverage"
- **THEN** its row title is first "News search" and then "Searching news coverage"

### Requirement: Finalizer row and hide toggle
The finalizer row SHALL follow `analysis.finalizing`, `analysis.finalized` and `analysis.finalization_failed`. The `Hide progress details` toggle SHALL collapse the ledger.

#### Scenario: Collapse
- **WHEN** the user presses `Hide progress details`
- **THEN** the ledger rows are not shown

### Requirement: Active Worker Ledger status pills
The status pill SHALL be grey `Pending` for pending, blue `Running` for running, green `Completed` for succeeded, orange with `error.code` for failed (`timeout` shown as `Timed out`) and grey `Skipped` with the note for skipped.

#### Scenario: Rows from snapshot and events
- **WHEN** a snapshot with a 3-entry plan is followed by `analyzer.started`, `analyzer.succeeded` and `analyzer.failed` with `error.code: timeout`
- **THEN** three rows show in plan order with Completed and Timed out pills and durations

#### Scenario: Skipped with note
- **WHEN** an analyzer is skipped with note "Not run: no claims"
- **THEN** its row shows `Skipped` and the note

### Requirement: Scrape failure card
On `scrape.failed`, or `job.failed` with a failed scrape, the view SHALL show the `Unable to retrieve social post` card with `scrape.error.code` and message as plain text and a `Switch to Text Input` link to `/`. No analyzer rows SHALL be shown.

#### Scenario: Account not found
- **WHEN** `scrape.failed` carries `error.code: account_not_found`
- **THEN** the card shows that code and message, the link points to `/` and the ledger is absent

### Requirement: Terminal states
On `job.completed` the view SHALL navigate with replace to `/jobs/{id}`. On `job.cancelled` it SHALL show a `Cancelled` state with the partial runs and a link to the results. On `job.failed` it SHALL show the failure. A 404 on connect SHALL show an alert. If the event stream fails after 3 reconnects the view SHALL poll `GET /api/v1/jobs/{id}` every 2000 ms until the job is done.

#### Scenario: Completed
- **WHEN** `job.completed` arrives
- **THEN** the location becomes `/jobs/<id>` without adding a history entry

#### Scenario: Missing job
- **WHEN** the job does not exist
- **THEN** an alert says it was not found

#### Scenario: Polling fallback
- **WHEN** the socket closes 4 times without delivering an event
- **THEN** the view calls `GET /api/v1/jobs/<id>` every 2000 ms until `done` is true

### Requirement: Cancel
`✕ Cancel analysis` SHALL call `POST /api/v1/jobs/{id}/cancel`. A 202 SHALL show `Cancelling…` until `job.cancelled` arrives. A 409 `job_finished` SHALL show `The job already finished` and navigate to the results. Other errors SHALL show an alert.

#### Scenario: Cancel accepted
- **WHEN** the user cancels and the server answers 202
- **THEN** `Cancelling…` is shown until `job.cancelled`, then `Cancelled`

#### Scenario: Cancel too late
- **WHEN** the server answers 409 `job_finished`
- **THEN** `The job already finished` is shown and the app navigates to `/jobs/<id>`

### Requirement: Propaganda detection confidence in ledger rows
For a settled `propaganda_detection` Active Worker Ledger row whose preview has a string `label`, the preview summary SHALL be the label, then ` · `, then `Math.round(score × 100)` as a percentage and the word `confidence` (for example `PROPAGANDA · 93% confidence`). The percentage SHALL be shown only when `score` is a finite number in [0, 1]. The score SHALL be worded as confidence in the label and never as a propaganda probability.

#### Scenario: Propaganda label with score
- **WHEN** a settled `propaganda_detection` preview is `{label: "PROPAGANDA", score: 0.934}`
- **THEN** the row detail is `PROPAGANDA · 93% confidence`

#### Scenario: Score bounds
- **WHEN** the score is 0 or 1
- **THEN** the detail ends in `0% confidence` or `100% confidence`

### Requirement: Propaganda detection summary fallbacks
When `score` is absent or invalid the `propaganda_detection` summary SHALL be the label alone. When `label` is not a string the summary SHALL be empty, so the row shows the Activity detail. The summary SHALL never contain `NaN`, `null`, `undefined` or an empty ` · ` separator. Preview summaries of all other analyzer keys SHALL be unchanged.

#### Scenario: Score absent or invalid
- **WHEN** the preview has a label and `score` is null, missing, non-finite or outside [0, 1]
- **THEN** the row detail is the label alone

#### Scenario: Label missing
- **WHEN** the preview has a score but no string label
- **THEN** the summary is empty and the row shows the Activity detail

### Requirement: Home feature grid layout
The Home feature row SHALL lay out its cards in as many equal-width columns as there are cards (two) above 960px viewport width, with no empty grid track, and in a single column at 960px and below.

#### Scenario: Wide viewport
- **WHEN** the viewport is wider than 960px
- **THEN** the two cards fill two equal columns
