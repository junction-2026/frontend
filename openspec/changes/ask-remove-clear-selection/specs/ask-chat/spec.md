## MODIFIED Requirements

### Requirement: Focus copy in every locale
All new Ask text (pane heading and region name, narrow toggle, section toggle name "Ask about {label}", "Select all" (`ask.focus.select_all`), remove chip, limit note, whole-analysis hint, "About:" line, empty and not-completed notes) SHALL be in the `ask` namespace for en, de, fr, fi, ar and ru, with the brand "VEIL" verbatim. The key `ask.focus.clear` SHALL NOT exist in any locale.

#### Scenario: Arabic
- **WHEN** the locale is `ar`
- **THEN** the page renders right-to-left with the chat at the right, the Select all label is localized and no static Latin-script text other than the brand appears

#### Scenario: No clear key
- **WHEN** the `ask` catalogs of en, de, fr, fi, ar and ru are inspected
- **THEN** none defines `focus.clear`

### Requirement: Selection limit
At most 20 elements SHALL be selectable. Once 20 are selected (including right after the default selection or "Select all") the unselected toggles SHALL be disabled and a polite live note SHALL say the limit is reached. The result pane SHALL NOT render a "Clear selection" button for any selection state.

#### Scenario: Limit
- **WHEN** 20 elements are selected
- **THEN** the other toggles are disabled and the limit note is shown; deselecting one enables them again

#### Scenario: Clear
- **WHEN** all, some or no elements are selected
- **THEN** no "Clear selection" button is present in `.ask-result-head`

### Requirement: Select all action
Activating the checkbox (click, Space) when it is checked SHALL clear the selection. Otherwise it SHALL set the selection to the first min(n, 20) `focusItemsOf` items in panel order. The Select all checkbox SHALL be the only control in the pane header that clears the whole selection; individual section toggles and chip removal are unchanged.

#### Scenario: Deselect from checked
- **WHEN** the checkbox is checked and the user activates it
- **THEN** no chips remain, the whole-analysis hint is shown and the next request has no `focus` member

#### Scenario: Select from partial or empty
- **WHEN** the selection is partial (indeterminate) or empty and the user activates the checkbox
- **THEN** the first min(n, 20) elements in panel order are selected

#### Scenario: No Clear selection button
- **WHEN** all, some or no elements are selected
- **THEN** no "Clear selection" button is present in `.ask-result-head`
