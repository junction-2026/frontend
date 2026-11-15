## MODIFIED Requirements

### Requirement: Split layout
`/jobs/:id/ask` for a loaded job SHALL render a two-column grid at viewport widths of 960px and more with the chat section (context bar, thread, composer) first in the DOM at inline-start and the result pane second at inline-end, using CSS logical properties (left in ltr, right in rtl for the chat). Each column SHALL scroll independently within the viewport height so the composer remains reachable while the result is read. Below 960px the sections SHALL stack with the chat first.

#### Scenario: Wide viewport
- **WHEN** the viewport is at least 960px wide
- **THEN** the chat and the result pane are side by side, the chat is in the inline-start column and each column scrolls on its own

#### Scenario: Narrow viewport
- **WHEN** the viewport is narrower than 960px
- **THEN** the sections are stacked, chat first

### Requirement: Narrow toggle
Below 960px a "Choose result elements" button near the composer SHALL scroll to the result pane and move focus to its `<h2>` heading. The pane SHALL have `role="region"` with a localized accessible name. At 960px and more the button SHALL be hidden.

#### Scenario: Toggle
- **WHEN** the user presses "Choose result elements"
- **THEN** the pane heading has keyboard focus

### Requirement: Panel states
For a job that is not completed, or that has no selectable elements, the result pane SHALL show a localized note and no selection toggles. Selection toggles SHALL be disabled while the composer is disabled.

#### Scenario: Running job
- **WHEN** the job is `running`
- **THEN** the pane shows the note and no toggle exists, and the composer is disabled

### Requirement: Selection chips
The selection SHALL be shown above the composer as a list of chips, each with the label and a remove button named "Remove <label>"; removing a chip deselects the element. With nothing selected a localized hint SHALL say the question is about the whole analysis. The selection SHALL live in component state only and not survive a reload.

#### Scenario: Chip removal
- **WHEN** the user presses "Remove Doubt"
- **THEN** the chip is gone and the toggle of that element is no longer pressed

### Requirement: Focus copy in every locale
All new Ask text (pane heading and region name, narrow toggle, section toggle name "Ask about {label}", clear selection, remove chip, limit note, whole-analysis hint, "About:" line, empty and not-completed notes) SHALL be in the `ask` namespace for en, de, fr, fi, ar and ru, with the brand "VEIL" verbatim.

#### Scenario: Arabic
- **WHEN** the locale is `ar`
- **THEN** the page renders right-to-left with the chat at the right and no static Latin-script text other than the brand

### Requirement: Result pane content
The result pane SHALL render the result screen's Verdict and detailed region (excerpt, technique tags, explore link and copy action, metrics bar, JobView with risk score, Wikipedia lookup, term context, Coverage) through the same components as `/jobs/:id`, always expanded, inside the same LocalizationProvider. It SHALL NOT render the "View detailed"/"Hide detailed" toggle or the "Ask VEIL" link.

#### Scenario: Same content as the result screen
- **WHEN** a completed job with techniques, a Wikipedia claim and a term is shown
- **THEN** the pane shows the verdict label, the technique name, the claim text and the term without any click, and no "View detailed" button

#### Scenario: Absent data
- **WHEN** the Job has no `wikipedia` result and no risk
- **THEN** no Wikipedia or risk sections or toggles are rendered

## REMOVED Requirements

### Requirement: Selection controls
**Reason**: The checkbox list is replaced by toggles on the rendered sections (Section selection controls, Selection limit).
**Migration**: None; the selection state and the focus sent are unchanged.

## ADDED Requirements

### Requirement: Section selection controls
Each element listed by `focusItemsOf` SHALL have a toggle button on its rendered section (verdict card, technique item, passage under its technique, LLM finding, risk dimension, driver and caveat, Wikipedia claim, term entry). The button SHALL have `aria-pressed`, the localized accessible name "Ask about <label>" (label as shown, at most 120 code points) and a `:focus-visible` ring from existing tokens; the section SHALL show a selected style. Click, Enter and Space SHALL activate it.

#### Scenario: Technique toggle
- **WHEN** the user presses "Ask about Doubt" on the technique list item
- **THEN** it has `aria-pressed="true"`, a chip "Doubt" appears and the next request has `focus` `[{kind:'technique', ref:'Doubt', label:'Doubt'}]`; pressing again removes the chip and `focus` is omitted

### Requirement: Selection keys
Toggle keys SHALL be `kind:ref` computed from the raw job arrays and SHALL match the `focusItemsOf` keys: raw index for LLM findings, `Job.risk.drivers`, Wikipedia claims and term context; Detection `name`; `<start>:<end>:<technique>`; dimension key; first caveat id; `final_assessment`. An element whose key `focusItemsOf` does not list (for example a blank label) SHALL have no toggle. `focusItemsOf` SHALL stay the source of labels, sent labels (at most 500 code points) and `focus` order.

#### Scenario: Raw indexes
- **WHEN** the first of three risk drivers is not an object
- **THEN** the toggle of the last sends `{kind:'risk_driver', ref:'2'}` and a passage toggle sends `<start>:<end>:<technique>`

#### Scenario: Blank label
- **WHEN** a term entry has a blank term
- **THEN** it is not rendered with a toggle

### Requirement: Selection limit
At most 20 elements SHALL be selectable. Once 20 are selected the unselected toggles SHALL be disabled and a polite live note SHALL say the limit is reached. A "Clear selection" button SHALL be shown in the pane header while at least one element is selected.

#### Scenario: Limit
- **WHEN** 20 elements are selected
- **THEN** the other toggles are disabled and the limit note is shown; deselecting one enables them again

#### Scenario: Clear
- **WHEN** the user presses "Clear selection"
- **THEN** nothing is selected and the button is gone

## RENAMED Requirements
- FROM: `### Requirement: Result panel content`
- TO: `### Requirement: Result pane content`
