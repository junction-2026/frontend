## MODIFIED Requirements

### Requirement: Detail metrics
The Detail screen SHALL show a metrics bar with Patterns (detected techniques of the `succeeded` `techniques` run, else "—"), Claims (`claims` of a `succeeded` `topic_extraction` run, else "—"), Risk and Latency. The Risk cell SHALL NOT be wrapped in `Mock` and shows the real risk (percentage and band chip, else "—"); Latency SHALL be wrapped in `Mock`. Technique entries SHALL show `Detection.name` as ID badge and no match percentage; confidence SHALL NOT be shown.

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

### Requirement: Shared detail body
The Detail metrics bar (Patterns, Claims, Risk and Mock Latency) and the full JobView (title, highlighted text, technique list, risk overview, why region, notes, LLM-assessed group) SHALL be one component shared by `/jobs/:id/detail` and the detailed region of `/jobs/:id`; `/jobs/:id/detail` SHALL render as before apart from the Risk cell and the overview.

#### Scenario: Metrics in the region
- **WHEN** two techniques were detected and the region is expanded
- **THEN** the metrics bar shows Patterns "2 detected" and the JobView content is present
