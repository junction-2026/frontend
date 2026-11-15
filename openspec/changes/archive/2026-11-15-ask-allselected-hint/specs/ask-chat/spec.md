## MODIFIED Requirements

### Requirement: Selection chips
A partial selection SHALL be shown above the composer as chips, each with the label and a remove button "Remove <label>" that deselects the element. When the selection is empty or contains every `focusItemsOf` item, the focus bar SHALL show only the localized hint `ask.focus.hint` and no chip list. The selection SHALL live in component state only and not survive a reload.

#### Scenario: Chip removal
- **WHEN** the selection is partial and the user presses "Remove Doubt"
- **THEN** the chip is gone and the toggle of that element is no longer pressed

#### Scenario: All selected
- **WHEN** a job has N <= 20 focusable items and all N are selected
- **THEN** the whole-analysis hint is shown and no chip list or "Remove <label>" button is rendered

#### Scenario: One deselected
- **WHEN** all N items are selected and the user deselects one
- **THEN** N-1 chips are shown and the hint is not

#### Scenario: Reselected
- **WHEN** that element is selected again
- **THEN** the hint is shown again and no chips

#### Scenario: Over the limit
- **WHEN** a job has more than 20 focusable items and 20 are selected
- **THEN** 20 chips are shown and the hint is not

### Requirement: Section selection controls
Each element listed by `focusItemsOf` SHALL have a toggle button on its rendered section (verdict card, technique item, passage under its technique, LLM finding, risk dimension, driver and caveat, Wikipedia claim, term entry). The button SHALL have `aria-pressed`, the localized accessible name "Ask about <label>" (label as shown, at most 120 code points) and a `:focus-visible` ring from existing tokens; the section SHALL show a selected style. Click, Enter and Space SHALL activate it.

#### Scenario: Technique toggle
- **WHEN** nothing is selected and the user presses "Ask about Doubt" on the technique list item (a partial selection)
- **THEN** it has `aria-pressed="true"`, a chip "Doubt" appears and the next request has `focus` `[{kind:'technique', ref:'Doubt', label:'Doubt'}]`; pressing again removes the chip and `focus` is omitted

### Requirement: Default selection
When a `JobChat` instance first sees a non-empty `focusItemsOf` list for a completed job, the selection SHALL be set once to the first min(n, 20) items in panel order. The default SHALL NOT be re-applied on re-render, job polling, locale change or after the user empties the selection. The request payload is unchanged: an all-selected state still sends `focus` with every selected item.

#### Scenario: Default with up to 20 elements
- **WHEN** a completed job with N <= 20 elements is opened
- **THEN** every toggle has `aria-pressed="true"`, the whole-analysis hint is shown with no chips, and the first request carries `focus` with all N items in panel order

#### Scenario: Default with more than 20 elements
- **WHEN** a completed job with more than 20 elements is opened
- **THEN** the first 20 in panel order are selected, 20 chips are shown, the other toggles are disabled and the limit note is shown

#### Scenario: Job completes while open
- **WHEN** a running job completes while the page is open
- **THEN** the default selection is applied once, and later polls or re-renders after the user changed the selection do not re-apply it
