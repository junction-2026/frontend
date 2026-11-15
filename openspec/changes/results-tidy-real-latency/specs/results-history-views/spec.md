## ADDED Requirements

### Requirement: Detail metrics Latency
The Latency cell of the Detail metrics bar SHALL show `finished_at` minus `created_at`, formatted like the meta-row duration (`results.duration.ms` under 1000 ms, else `results.duration.s`) and not wrapped in `Mock`. When `finished_at` is null or the span is missing, unparseable or negative it SHALL show "—".

#### Scenario: Latency under one second
- **WHEN** the job finished 284 ms after `created_at`
- **THEN** Latency shows `284 ms` with no `Mock` ancestor

#### Scenario: Latency in seconds
- **WHEN** `created_at` is `2026-11-14T10:00:00Z` and `finished_at` is `2026-11-14T10:00:03.200Z`
- **THEN** Latency shows `3.2 s` (en), with no `Mock` ancestor, and no hardcoded `412` appears

#### Scenario: Latency unavailable
- **WHEN** `finished_at` is null, or the timestamps are unparseable or the span is negative
- **THEN** Latency shows "—"

## MODIFIED Requirements

### Requirement: Results fetching and meta row
The Results screen (`/jobs/:id`) SHALL fetch `getJob` and, while `done` is false, SHALL poll every 2000 ms and show a "Watch live progress" link to `/jobs/:id/live`. The meta row SHALL show the job id and the duration from `created_at` to `finished_at` (when finished). A model name SHALL NOT be shown. The duration formatting SHALL live in one helper shared with the Detail metrics bar Latency, so the two never differ.

#### Scenario: Running job
- **WHEN** the first response has `done: false`
- **THEN** a "Watch live progress" link to `/jobs/j1/live` is shown and a second request follows after 2000 ms

#### Scenario: Finished job
- **WHEN** the job is done with `created_at` and `finished_at` 3.2 s apart
- **THEN** the meta row shows the job id and the duration and no "Model:" text

### Requirement: Detail metrics
The Detail screen SHALL show a metrics bar with Patterns (detected techniques of the `succeeded` `techniques` run, else "—"), Claims (`claims` of a `succeeded` `topic_extraction` run, else "—"), Risk (real percentage and band chip, else "—", not in `Mock`) and Latency. Latency follows 'Detail metrics Latency'. Technique entries SHALL show `Detection.name` as ID badge and no match percentage; confidence SHALL NOT be shown.

#### Scenario: Metrics
- **WHEN** two techniques were detected and `topic_extraction` succeeded with three claims
- **THEN** Patterns shows 2, Claims shows 3 and no confidence is shown

#### Scenario: Scored risk
- **WHEN** `risk` is scored with score 0.72 and band `high`
- **THEN** the Risk cell shows the formatted `72%` and a localized `High risk` chip (colours per 'Risk band colours'), with no `Mock` ancestor

#### Scenario: Risk unavailable
- **WHEN** `risk` is unavailable, fails 'Risk score context is required', or is null or missing
- **THEN** the Risk cell shows "—"

#### Scenario: Unknown band
- **WHEN** the band is `extreme`
- **THEN** the chip shows `extreme` with the moderate colours

#### Scenario: Claims unavailable
- **WHEN** `topic_extraction` failed
- **THEN** Claims shows "—"

### Requirement: Detailed analysis region content
The detailed region SHALL contain the analyzed excerpt (first 400 characters), the technique tags, "Explore coverage", "Open detailed analysis page" and the Copy button, followed by the Detail metrics bar, the JobView and the Coverage section.

#### Scenario: Expanded content
- **WHEN** the region is expanded
- **THEN** it shows the excerpt, technique tags, coverage and the link to `/jobs/:id/detail`

### Requirement: Shared detail body
The Detail metrics bar (Patterns, Claims, Risk and Latency, all real values) and the full JobView (title, highlighted text, technique list, risk overview, why region, notes, LLM-assessed group) SHALL be one component shared by `/jobs/:id/detail` and the detailed region of `/jobs/:id`; `/jobs/:id/detail` SHALL render as before apart from the Risk cell and the overview.

#### Scenario: Metrics in the region
- **WHEN** two techniques were detected and the region is expanded
- **THEN** the metrics bar shows Patterns "2 detected" and the JobView content is present

### Requirement: Mock-only parts of the Results screen
The detailed analysis region SHALL NOT render a Polarity/Intensity signal row, a "High rhetorical bias factor" line or a Share button. Copy SHALL copy the page URL to the clipboard without `Mock`. "Explore coverage" SHALL link to `/explore?job=<encoded job id>` and "Open detailed analysis page" to `/jobs/:id/detail`.

#### Scenario: Removed items
- **WHEN** the detailed region of a job with a `detected` verdict is expanded
- **THEN** it contains no "High rhetorical bias factor", no Polarity/Intensity text, no Share button and no `[data-mock]` element

#### Scenario: Copy
- **WHEN** the user presses Copy
- **THEN** `navigator.clipboard.writeText` receives the page URL and Copy has no `Mock` ancestor

#### Scenario: Explore coverage link
- **WHEN** Results renders for job `j 1`
- **THEN** the link "Explore coverage" has `href` `/explore?job=j%201` and no "Cross-source coverage" link exists
