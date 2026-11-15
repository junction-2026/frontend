## ADDED Requirements

### Requirement: Select all control
The result pane header SHALL contain a native `<input type="checkbox">` with a visible `<label>` "Select all" (i18n key `ask.focus.select_all`), placed after the "Analysis result" `<h2>` and aligned to the inline end of the heading row (to the right in LTR, mirrored in RTL). It SHALL use existing design tokens, have a `:focus-visible` ring, and keep the header row wrapping on narrow widths without overlapping the heading.

#### Scenario: Placement
- **WHEN** a completed job with focusable elements is opened
- **THEN** the checkbox follows the `<h2>` in `.ask-result-head`, labelled "Select all"

### Requirement: Select all state
The checkbox SHALL be checked when the selected count equals min(number of focusable items, 20), indeterminate (via the `indeterminate` property) when at least one but fewer are selected, and unchecked when none are selected.

#### Scenario: Partial selection
- **WHEN** one element of 15 is deselected
- **THEN** the checkbox is unchecked and indeterminate

### Requirement: Select all action
Activating the checkbox (click, Space) when it is checked SHALL clear the selection. Otherwise it SHALL set the selection to the first min(n, 20) `focusItemsOf` items in panel order.

#### Scenario: Deselect from checked
- **WHEN** the checkbox is checked and the user activates it
- **THEN** no chips remain, the whole-analysis hint is shown and the next request has no `focus` member

#### Scenario: Select from partial or empty
- **WHEN** the selection is partial (indeterminate) or empty and the user activates the checkbox
- **THEN** the first min(n, 20) elements in panel order are selected

### Requirement: Select all availability
The checkbox SHALL be disabled whenever the section toggles are disabled (chat conflict 409). It SHALL NOT be rendered when `focusItemsOf` returns no items or the job is not completed.

#### Scenario: Conflict
- **WHEN** the chat answered 409 `job_not_completed`
- **THEN** the checkbox is disabled

#### Scenario: Absent
- **WHEN** the job has no focusable elements or is not completed
- **THEN** no checkbox is rendered

### Requirement: Default selection
When a `JobChat` instance first sees a non-empty `focusItemsOf` list for a completed job, the selection SHALL be set once to the first min(n, 20) items in panel order. The default SHALL NOT be re-applied on re-render, job polling, locale change or after the user empties the selection. The selection SHALL still live in component state only and not survive a reload.

#### Scenario: Default with up to 20 elements
- **WHEN** a completed job with N <= 20 elements is opened
- **THEN** every toggle has `aria-pressed="true"`, N chips are shown and the first request carries `focus` with all N items in panel order

#### Scenario: Default with more than 20 elements
- **WHEN** a completed job with more than 20 elements is opened
- **THEN** the first 20 in panel order are selected, the other toggles are disabled and the limit note is shown

#### Scenario: Job completes while open
- **WHEN** a running job completes while the page is open
- **THEN** the default selection is applied once, and later polls or re-renders after the user changed the selection do not re-apply it

## MODIFIED Requirements

### Requirement: Selection limit
At most 20 elements SHALL be selectable. Once 20 are selected (including right after the default selection or "Select all") the unselected toggles SHALL be disabled and a polite live note SHALL say the limit is reached. A "Clear selection" button SHALL be shown in the pane header while at least one element is selected.

#### Scenario: Limit
- **WHEN** 20 elements are selected
- **THEN** the other toggles are disabled and the limit note is shown; deselecting one enables them again

#### Scenario: Clear
- **WHEN** the user presses "Clear selection"
- **THEN** nothing is selected and the button is gone

### Requirement: Focus copy in every locale
All new Ask text (pane heading and region name, narrow toggle, section toggle name "Ask about {label}", clear selection, "Select all" (`ask.focus.select_all`), remove chip, limit note, whole-analysis hint, "About:" line, empty and not-completed notes) SHALL be in the `ask` namespace for en, de, fr, fi, ar and ru, with the brand "VEIL" verbatim.

#### Scenario: Arabic
- **WHEN** the locale is `ar`
- **THEN** the page renders right-to-left with the chat at the right, the Select all label is localized and no static Latin-script text other than the brand appears

### Requirement: Panel states
For a job that is not completed, or that has no selectable elements, the result pane SHALL show a localized note, no selection toggles and no Select all checkbox. Selection toggles SHALL be disabled while the composer is disabled.

#### Scenario: Running job
- **WHEN** the job is `running`
- **THEN** the pane shows the note and no toggle or checkbox exists, and the composer is disabled

### Requirement: Selection chips
The selection SHALL be shown above the composer as a list of chips, each with the label and a remove button named "Remove <label>"; removing a chip deselects the element. With nothing selected a localized hint SHALL say the question is about the whole analysis. The selection SHALL live in component state only (defaulting as in "Default selection") and not survive a reload.

#### Scenario: Chip removal
- **WHEN** the user presses "Remove Doubt"
- **THEN** the chip is gone and the toggle of that element is no longer pressed
