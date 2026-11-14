## REMOVED Requirements

### Requirement: Mock-only parts of Results
**Reason**: Replaced by an identically specified requirement with the product name changed to "Stiriri" (scenario names contained the old brand).
**Migration**: See "Mock-only parts of the Results screen".

## ADDED Requirements

### Requirement: Mock-only parts of the Results screen
In the detailed analysis region the "Polarity / Intensity" signal row, "High rhetorical bias factor" and the Share button SHALL be wrapped in `Mock`. Copy SHALL copy the page URL to the clipboard without `Mock`. "Explore coverage" SHALL link to `/explore?job=<encoded job id>` and "Open detailed analysis page" to `/jobs/:id/detail`.

#### Scenario: Copy
- **WHEN** the user presses Copy
- **THEN** `navigator.clipboard.writeText` receives the page URL and Copy has no `Mock` ancestor

#### Scenario: Explore coverage link
- **WHEN** Results renders for job `j 1`
- **THEN** the link "Explore coverage" has `href` `/explore?job=j%201` and no "Cross-source coverage" link exists

### Requirement: Ask Stiriri link on Results
The Ask Stiriri call-to-action card SHALL NOT be shown on Results; the compact "Ask Stiriri" link carries no data and SHALL NOT be wrapped in `Mock`.

#### Scenario: Ask Stiriri link
- **WHEN** the Results screen is shown
- **THEN** the "Ask Stiriri" link points to `/ask`, has no `Mock` ancestor and no "Have questions about this verdict" card is shown

## MODIFIED Requirements

### Requirement: Verdict states
Each verdict state SHALL use its own background token, heading and body text as given in its scenario; `uncertain` and every unknown value SHALL read as `uncertain`.

#### Scenario: Detected
- **WHEN** the verdict is `detected`
- **THEN** the background is `--verdict-detected-bg` (#E4F3E8), the heading "Yes, propaganda detected." and the text "Stiriri identified signs of manipulative messaging in this content."

#### Scenario: Uncertain
- **WHEN** the verdict is `uncertain` or unknown
- **THEN** the background is `--verdict-uncertain-bg` (#FFF0D9), the heading "We're not sure yet." and the text "The available evidence is insufficient or conflicting."

#### Scenario: Not detected
- **WHEN** the verdict is `not_detected`
- **THEN** the background is `--verdict-not-detected-bg` (#E6F0FF), the heading "No clear signs of propaganda." and the text "Stiriri did not identify strong indicators of propaganda in this content."

### Requirement: Confidence tooltip
Next to the confidence line a button with `aria-label` "What does confidence mean?" SHALL show an element with `role="tooltip"` on hover and focus and hide it on blur, mouse leave and Escape; the button SHALL reference it with `aria-describedby`. The tooltip text SHALL be "How confident Stiriri's final assessment is that this verdict is supported by the available evidence. It is not the probability that the content is propaganda."

#### Scenario: Focus
- **WHEN** the button receives keyboard focus
- **THEN** the tooltip with that text appears and the button's `aria-describedby` references it; pressing Escape hides it

### Requirement: Initial actions
Below the verdict the Results screen SHALL show a primary `<button>` "View detailed analysis" (class `btn-primary`) and a secondary link "Ask Stiriri" (class `btn-secondary`, `href` `/ask`). Apart from the meta row (job id, duration, "Watch live progress" while not done) and, for non-verdict states, the state card, nothing else SHALL be shown in the initial view.

#### Scenario: Initial view
- **WHEN** a completed job with techniques and analyzers is shown
- **THEN** no technique tag, coverage, analyzer row, highlighted text, claim, metrics bar, Polarity/Intensity, bias-factor or excerpt is shown
