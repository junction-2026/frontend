## MODIFIED Requirements

### Requirement: Verdict card
For a job whose `finalization.status` is `completed` with a `result`, the Results card SHALL show a verdict banner whose level-2 heading is the verdict label: `detected` "Manipulation detected", `not_detected` "No manipulation indicators", `uncertain` or unknown "Uncertain". The Results screen SHALL NOT render `result.user_text`. A result with `produced_by` `orchestrator` SHALL show the "Insufficient evidence" tag. Confidence and scores SHALL NOT be shown as numbers or percentages.

#### Scenario: Detected
- **WHEN** the verdict is `detected` and `confidence` is `0.86`
- **THEN** the banner heading reads "Manipulation detected" and no `0.86` or `86%` is shown

#### Scenario: Unknown verdict
- **WHEN** the verdict is `suspicious`
- **THEN** the banner heading reads "Uncertain"

#### Scenario: Markup in user text
- **WHEN** `user_text` is `<b>fake</b> [click](https://example.com)`
- **THEN** none of it is shown on the Results screen and no `b` or `a` element is created

#### Scenario: Insufficient evidence
- **WHEN** `produced_by` is `orchestrator`
- **THEN** the tag "Insufficient evidence" is shown next to the banner

### Requirement: Finalization states
While `finalization.status` is `pending` or `running` the card SHALL show "Final assessment in progress". For `skipped` it SHALL show the reason: `not_configured` "No final assessment configured", `disabled_by_request` "Final assessment turned off for this job", `cancelled` "Final assessment cancelled". For `failed` it SHALL show "Final assessment failed" and `error.code` (`timeout` as "Timed out"). These cards SHALL show no verdict banner. Analyzer results SHALL remain visible.

#### Scenario: Skipped by request
- **WHEN** finalization is `skipped` with `reason: disabled_by_request`
- **THEN** "Final assessment turned off for this job" is shown with the coverage section and no verdict banner

#### Scenario: Done without finalization
- **WHEN** the job is done and has no finalization result
- **THEN** the pill "No final assessment" and its message are shown with a neutral background

#### Scenario: Finalization timed out
- **WHEN** finalization is `failed` with `error.code: timeout`
- **THEN** "Final assessment failed" and "Timed out" are shown and the job is not shown as failed

### Requirement: Job states
A job with `status: failed` and `scrape.status: failed` SHALL show a scrape error card with `scrape.error.code` and `message` as plain text; any other `failed` job SHALL show "Analysis failed". `cancelled` SHALL show "Cancelled" and keep the settled analyzer runs. These cards SHALL keep their pill and headline message with a neutral background (no verdict banner). An unknown status SHALL be treated by `done`. A failed or timed-out analyzer SHALL NOT make the job appear failed.

#### Scenario: Failed scrape
- **WHEN** the job is `failed` and `scrape.error` is `{"code": "account_private", "message": "Account is private"}`
- **THEN** the scrape error card shows `account_private` and `Account is private`

#### Scenario: Analyzer failure only
- **WHEN** one analyzer is `failed` and the job is `completed`
- **THEN** "Analysis failed" is not shown

## ADDED Requirements

### Requirement: Verdict banner colour
The verdict banner background SHALL be red (`var(--danger)`) for `detected`, orange (`var(--orange)`) for `uncertain` and unknown verdicts, and green (`var(--green)`) for `not_detected`. The colour SHALL be exposed as a class on the banner element (`verdict-banner red`, `verdict-banner orange` or `verdict-banner green`). The History tag tones SHALL remain unchanged.

#### Scenario: Detected is red
- **WHEN** the verdict is `detected`
- **THEN** the banner has the classes `verdict-banner` and `red`

#### Scenario: Unknown is orange
- **WHEN** the verdict is `suspicious`
- **THEN** the banner has the classes `verdict-banner` and `orange`

#### Scenario: Not detected is green
- **WHEN** the verdict is `not_detected`
- **THEN** the banner has the classes `verdict-banner` and `green`

### Requirement: Verdict banner accessibility
The banner label SHALL be rendered as text at large-text size (at least 24px, or 18.66px bold) in white on the banner background, a contrast of at least 3:1. Colour SHALL NOT be the only carrier of the verdict, and any decorative glyph SHALL be `aria-hidden`.

#### Scenario: Label is text
- **WHEN** the banner is shown
- **THEN** the verdict is readable as the text of the level-2 heading

### Requirement: Detail verdict text
The Detail screen (`/jobs/:id/detail`) SHALL show a "Final assessment" section with the verdict label and `finalization.result.user_text` as a plain text node (no HTML, Markdown or links) when `finalization.status` is `completed` with a `result`, and SHALL omit the section otherwise. A result with `produced_by` `orchestrator` SHALL show the "Insufficient evidence" tag in that section. No confidence or score number SHALL be shown.

#### Scenario: Markup in user text
- **WHEN** `user_text` is `<b>fake</b> [click](https://example.com)`
- **THEN** exactly those characters are shown and no `b` or `a` element is created from them

#### Scenario: No completed result
- **WHEN** the finalization is `skipped`
- **THEN** no "Final assessment" section is shown
