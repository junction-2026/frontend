## REMOVED Requirements

### Requirement: Ask Stiriri link on Results
**Reason**: Replaced by "Ask VEIL link on Results"; the OpenSpec validator requires a MODIFIED requirement to keep its scenario names, and the old scenario name contains the interim brand, so a rename is not possible.
**Migration**: See "Ask VEIL link on Results".

## MODIFIED Requirements

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

### Requirement: Confidence tooltip
Next to the confidence line a button with `aria-label` "What does confidence mean?" SHALL show an element with `role="tooltip"` on hover and focus and hide it on blur, mouse leave and Escape; the button SHALL reference it with `aria-describedby`. The tooltip text SHALL be "How confident VEIL's final assessment is that this verdict is supported by the available evidence. It is not the probability that the content is propaganda."

#### Scenario: Focus
- **WHEN** the button receives keyboard focus
- **THEN** the tooltip with that text appears and the button's `aria-describedby` references it; pressing Escape hides it

### Requirement: Initial actions
Below the verdict the Results screen SHALL show a primary `<button>` "View detailed analysis" (class `btn-primary`) and a secondary link "Ask VEIL" (class `btn-secondary`, `href` `/ask`). Apart from the meta row (job id, duration, "Watch live progress" while not done) and, for non-verdict states, the state card, nothing else SHALL be shown in the initial view.

#### Scenario: Initial view
- **WHEN** a completed job with techniques and analyzers is shown
- **THEN** no technique tag, coverage, analyzer row, highlighted text, claim, metrics bar, Polarity/Intensity, bias-factor or excerpt is shown

## ADDED Requirements

### Requirement: Ask VEIL link on Results
The Ask VEIL call-to-action card SHALL NOT be shown on Results; the compact "Ask VEIL" link carries no data and SHALL NOT be wrapped in `Mock`.

#### Scenario: Ask VEIL link
- **WHEN** the Results screen is shown
- **THEN** the "Ask VEIL" link points to `/ask`, has no `Mock` ancestor and no "Have questions about this verdict" card is shown
