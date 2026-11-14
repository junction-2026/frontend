## ADDED Requirements

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
