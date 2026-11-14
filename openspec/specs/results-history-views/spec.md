# results-history-views Specification

## Purpose
Defines the Results, Detailed analysis and History screens of the frontend: what they fetch from the analysis jobs API, how verdicts, finalization, job states, coverage and analyzer outcomes are presented, and which parts are marked as mock.

## Requirements

### Requirement: Results fetching and meta row
The Results screen (`/jobs/:id`) SHALL fetch `getJob` and, while `done` is false, SHALL poll every 2000 ms and show a "Watch live progress" link to `/jobs/:id/live`. The meta row SHALL show the job id and the duration from `created_at` to `finished_at` (when finished). A model name and a latency SHALL NOT be shown as real values.

#### Scenario: Running job
- **WHEN** the first response has `done: false`
- **THEN** a "Watch live progress" link to `/jobs/j1/live` is shown and a second request follows after 2000 ms

#### Scenario: Finished job
- **WHEN** the job is done with `created_at` and `finished_at` 3.2 s apart
- **THEN** the meta row shows the job id and the duration and no "Model:" text

### Requirement: Verdict card
For a job whose `finalization.status` is `completed` with a `result` on a job that is not `failed` or `cancelled`, Results SHALL render exactly one `<section>` verdict component above all other content, with an h2 heading, a line of body text, the confidence line and `user_text`. It SHALL carry `data-verdict`, chosen only through `verdictOf(result.verdict)`; confidence SHALL NOT change it. `uncertain` with `produced_by` `orchestrator` SHALL show an "Insufficient evidence" label.

#### Scenario: Detected
- **WHEN** the verdict is `detected`
- **THEN** exactly one verdict section with `data-verdict="detected"` and the heading "Yes, propaganda detected." is shown

#### Scenario: Unknown verdict
- **WHEN** the verdict is `suspicious`
- **THEN** the component has `data-verdict="uncertain"` and the heading "We're not sure yet."

#### Scenario: Markup in user text
- **WHEN** `user_text` is `<b>fake</b> [click](https://example.com)`
- **THEN** it is shown literally inside the verdict component and no `b` or `a` element is created

#### Scenario: Insufficient evidence
- **WHEN** the verdict is `uncertain` and `produced_by` is `orchestrator`
- **THEN** the label "Insufficient evidence" is shown inside the verdict component

### Requirement: Finalization states
While `finalization.status` is `pending` or `running`, or the job is not `done`, it SHALL show "Final assessment in progress". `skipped` SHALL show the reason: `not_configured` "No final assessment configured", `disabled_by_request` "Final assessment turned off for this job", `cancelled` "Final assessment cancelled". `failed` SHALL show "Final assessment failed" and `error.code` (`timeout` as "Timed out"). A done job without a result SHALL show "No final assessment is available for this job."

#### Scenario: Skipped by request
- **WHEN** finalization is `skipped` with `reason: disabled_by_request`
- **THEN** "Final assessment turned off for this job" is shown and no verdict component or confidence is shown

#### Scenario: Done without finalization
- **WHEN** the job is done and has no finalization result
- **THEN** the pill "No final assessment" and "No final assessment is available for this job." are shown with a neutral background

#### Scenario: Finalization timed out
- **WHEN** finalization is `failed` with `error.code: timeout`
- **THEN** "Final assessment failed" and "Timed out" are shown and the job is not shown as failed

#### Scenario: In progress
- **WHEN** finalization is `running` and the job is not done
- **THEN** "Final assessment in progress" and the "Watch live progress" link are shown and no verdict

### Requirement: Technique tags
The detailed analysis region of the Results screen SHALL show one tag per detected technique of the `succeeded` `techniques` run, labelled `plain_language.name` falling back to `display`, without a score. Optional members (`strength`, `located`, `margin`, `summary`) SHALL be ignored or used only when present; none SHALL be required. The tags SHALL NOT be shown while the region is collapsed.

#### Scenario: Tags without scores
- **WHEN** the run detected `Loaded_Language` with `score: 0.91` and the region is expanded
- **THEN** one tag "Loaded Language" is shown and no `0.91` or `91%`

### Requirement: Job states
A job with `status: failed` and `scrape.status: failed` SHALL show a scrape error card with `scrape.error.code` and `message` as plain text; any other `failed` job SHALL show "Analysis failed". `cancelled` SHALL show "Cancelled". An unknown status SHALL be treated by `done`. A failed or timed-out analyzer SHALL NOT make the job appear failed.

#### Scenario: Failed scrape
- **WHEN** the job is `failed` and `scrape.error` is `{"code": "account_private", "message": "Account is private"}`
- **THEN** the scrape error card shows `account_private` and `Account is private` and no verdict

#### Scenario: Analyzer failure only
- **WHEN** one analyzer is `failed` and the job is `completed`
- **THEN** "Analysis failed" is not shown

### Requirement: Coverage and analyzer outcomes
The detailed analysis region SHALL contain a section showing `coverage` as `succeeded`, `failed` and `skipped` of `applicable` with a bar sized by `settled / total`, and one row per AnalyzerRun with its name, a status pill and its `note`. A `failed` run with `error.code` `timeout` SHALL read "Timed out". A run whose `availability` is not `ran`, `not_applicable` or null SHALL be presented as unavailable. Runs `skipped` with reason `disabled` or `not_selected` SHALL be collapsed under "Not run".

#### Scenario: Timed-out analyzer
- **WHEN** a run is `failed` with `error.code: timeout` and the region is expanded
- **THEN** its row shows "Timed out"

#### Scenario: Unknown availability
- **WHEN** a run has `availability: "partial"`
- **THEN** its row shows "Unavailable"

#### Scenario: Collapsed runs
- **WHEN** two runs are `skipped` with `not_selected` and `disabled`
- **THEN** they are listed only inside a "Not run" disclosure

### Requirement: Mock-only parts of Results
In the detailed analysis region the "Polarity / Intensity" signal row, "High rhetorical bias factor" and the Share button SHALL be wrapped in `Mock`. Copy SHALL copy the page URL to the clipboard without `Mock`. "Cross-source coverage →" SHALL link to `/explore` and "Open detailed analysis page" to `/jobs/:id/detail`. The Ask VEIL call-to-action card SHALL NOT be shown on Results; the compact "Ask VEIL" link carries no data and SHALL NOT be wrapped in `Mock`.

#### Scenario: Copy
- **WHEN** the user presses Copy
- **THEN** `navigator.clipboard.writeText` receives the page URL and Copy has no `Mock` ancestor

#### Scenario: Ask VEIL link
- **WHEN** the Results screen is shown
- **THEN** the "Ask VEIL" link points to `/ask`, has no `Mock` ancestor and no "Have questions about this verdict" card is shown

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

### Requirement: Detail verdict text
The Detail screen (`/jobs/:id/detail`) SHALL show a "Final assessment" section with the verdict label and `finalization.result.user_text` as a plain text node (no HTML, Markdown or links) when `finalization.status` is `completed` with a `result`, and SHALL omit the section otherwise. A result with `produced_by` `orchestrator` SHALL show the "Insufficient evidence" tag in that section. No confidence or score number SHALL be shown.

#### Scenario: Markup in user text
- **WHEN** `user_text` is `<b>fake</b> [click](https://example.com)`
- **THEN** exactly those characters are shown and no `b` or `a` element is created from them

#### Scenario: No completed result
- **WHEN** the finalization is `skipped`
- **THEN** no "Final assessment" section is shown

### Requirement: Verdict component presentation
The verdict component SHALL have a border radius of `var(--radius-verdict)` (24px), padding of at least 32px (24px under 640px) and an Inter heading of at least 2rem on desktop. It SHALL appear with a fade and an 8px rise of at most 300ms, disabled under `prefers-reduced-motion`. Heading and body text SHALL meet WCAG AA contrast (4.5:1) on each background. Results SHALL NOT use `VERDICT_UI` labels.

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** the verdict component has no entrance animation

### Requirement: Verdict states
Each verdict state SHALL use its own background token, heading and body text as given in its scenario; `uncertain` and every unknown value SHALL read as `uncertain`.

#### Scenario: Detected
- **WHEN** the verdict is `detected`
- **THEN** the background is `--verdict-detected-bg` (#E4F3E8), the heading "Yes, propaganda detected." and the text "VEIL identified signs of manipulative messaging in this content."

#### Scenario: Uncertain
- **WHEN** the verdict is `uncertain` or unknown
- **THEN** the background is `--verdict-uncertain-bg` (#FFF0D9), the heading "We're not sure yet." and the text "The available evidence is insufficient or conflicting."

#### Scenario: Not detected
- **WHEN** the verdict is `not_detected`
- **THEN** the background is `--verdict-not-detected-bg` (#E6F0FF), the heading "No clear signs of propaganda." and the text "VEIL did not identify strong indicators of propaganda in this content."

### Requirement: Non-verdict states
Job and finalization states without a completed result SHALL render as a neutral or error card using the existing pill tones, never a verdict background, heading or confidence. "View detailed analysis" SHALL stay available in all of them so analyzer results remain reachable, including those of a `cancelled` job.

#### Scenario: Cancelled
- **WHEN** the job is `cancelled`
- **THEN** "Cancelled" is shown without a verdict or confidence and the analyzer rows are reachable through "View detailed analysis"

### Requirement: Confidence display
The verdict component SHALL show `${Math.round(c * 100)}% confidence` when `result.confidence` is a finite number `c` with `0 <= c <= 1`. Otherwise (null, missing, non-number, NaN, out of range) it SHALL show "Confidence unavailable" and no number. No other score or percentage SHALL appear in the verdict component. This replaces the former rule that confidence is never shown as a number for the Results verdict only; the Detail metrics bar SHALL still show no confidence.

#### Scenario: Confidence shown
- **WHEN** `confidence` is `0.94`
- **THEN** "94% confidence" is shown

#### Scenario: Confidence unavailable
- **WHEN** `confidence` is `null`, missing, `NaN`, a string or `1.2`
- **THEN** "Confidence unavailable" is shown and no `%`

### Requirement: Confidence tooltip
Next to the confidence line a button with `aria-label` "What does confidence mean?" SHALL show an element with `role="tooltip"` on hover and focus and hide it on blur, mouse leave and Escape; the button SHALL reference it with `aria-describedby`. The tooltip text SHALL be "How confident VEIL's final assessment is that this verdict is supported by the available evidence. It is not the probability that the content is propaganda."

#### Scenario: Focus
- **WHEN** the button receives keyboard focus
- **THEN** the tooltip with that text appears and the button's `aria-describedby` references it; pressing Escape hides it

### Requirement: Verdict explanation
`result.user_text` SHALL be rendered as a React text node (never HTML or Markdown, never linkified) in a container with `white-space: pre-wrap`. When it is longer than 280 code points (counted with `Array.from`, so surrogate pairs are not split) the first 280 code points plus "…" SHALL be shown with a "Show full explanation" button carrying `aria-expanded` that reveals the full text in place. Shorter text SHALL be shown in full without the button.

#### Scenario: Markup in user text
- **WHEN** `user_text` is `<b>fake</b> [click](https://example.com)`
- **THEN** exactly those characters are shown and no `b` or `a` element is created

#### Scenario: Long text
- **WHEN** `user_text` has 300 code points
- **THEN** 280 code points and "…" are shown and pressing "Show full explanation" sets `aria-expanded` to true and shows all 300

### Requirement: Initial actions
Below the verdict the Results screen SHALL show a primary `<button>` "View detailed analysis" (class `btn-primary`) and a secondary link "Ask VEIL" (class `btn-secondary`, `href` `/ask`). Apart from the meta row (job id, duration, "Watch live progress" while not done) and, for non-verdict states, the state card, nothing else SHALL be shown in the initial view.

#### Scenario: Initial view
- **WHEN** a completed job with techniques and analyzers is shown
- **THEN** no technique tag, coverage, analyzer row, highlighted text, claim, metrics bar, Polarity/Intensity, bias-factor or excerpt is shown

### Requirement: Progressive disclosure
"View detailed analysis" SHALL carry `aria-expanded` and `aria-controls` pointing to the detailed region (`role="region"`, `aria-label` "Detailed analysis"). It SHALL be collapsed on every load and collapsed content SHALL NOT be rendered. Expanding SHALL mount the region with a fade and slide of at most 300ms (none under `prefers-reduced-motion`) and change the button label to "Hide detailed analysis"; collapsing SHALL unmount it; focus SHALL stay on the button.

#### Scenario: Expand and collapse
- **WHEN** the user presses "View detailed analysis" and then "Hide detailed analysis"
- **THEN** `aria-expanded` is false, true, false and the region is present only while expanded

### Requirement: Detailed analysis region content
The detailed region SHALL contain the analyzed excerpt (first 400 characters), the technique tags, the Mock-wrapped Polarity/Intensity row and "High rhetorical bias factor", "Cross-source coverage →", "Open detailed analysis page" and the Copy and Share buttons, followed by the Coverage section.

#### Scenario: Expanded content
- **WHEN** the region is expanded
- **THEN** it shows the excerpt, technique tags, coverage and the link to `/jobs/:id/detail`

### Requirement: Shared detail body
The Detail metrics bar (Patterns, Claims, Mock Risk and Latency) and the full JobView (title, highlighted text, technique list, why region, notes, LLM-assessed group) SHALL be one component shared by `/jobs/:id/detail` and the detailed region of `/jobs/:id`; `/jobs/:id/detail` SHALL render as before.

#### Scenario: Metrics in the region
- **WHEN** two techniques were detected and the region is expanded
- **THEN** the metrics bar shows Patterns "2 detected" and the JobView content is present

### Requirement: Partial evidence warning
When a verdict is shown and `coverage.failed` is greater than 0 or any AnalyzerRun has status `failed` (including timeouts), the verdict component SHALL contain a small muted note with `role="note"`: "Some analyzers did not finish, so this result is based on partial evidence." A failed analyzer SHALL NOT make the job appear failed.

#### Scenario: Analyzer failed
- **WHEN** a verdict is shown and one analyzer run is `failed` with `error.code: timeout`
- **THEN** the note is shown inside the verdict component

### Requirement: History verdict labels unchanged
History verdict tags SHALL keep "Manipulation detected" (orange), "No manipulation indicators" (green) and "Uncertain" (purple); `VERDICT_UI` SHALL keep its values.

#### Scenario: History tags
- **WHEN** the History screen shows items with the three verdicts
- **THEN** the tag labels and tones are those above
