## MODIFIED Requirements

### Requirement: Advanced options panel
The `Advanced options ▾` control SHALL expand a panel listing every item of `GET /api/v1/analyzers`, in response order, as a checkbox row with the `name`, the `id` as a monospace badge, the `category`, "Depends on: <ids>" when `depends_on` is a non-empty array, and a status pill "Enabled" or "Disabled". Each API value SHALL be in `<bdi>` and ids are joined with ", ". Selectable rows SHALL be checked by default and toggle. The old `disabled` hint SHALL NOT be repeated.

#### Scenario: Full row
- **WHEN** the panel opens and the server lists an enabled analyzer, and a disabled one with `depends_on: ["a", "b"]`
- **THEN** each row shows its name, id badge, category and its Enabled or Disabled pill, and the second row also shows "Depends on: a, b"

#### Scenario: Panel content
- **WHEN** the panel opens and the server lists a selectable, a disabled and a non-selectable analyzer
- **THEN** all three are listed, the selectable ones checked, the disabled one with the "Disabled" pill, and the non-selectable one checked and disabled

#### Scenario: No final assessment toggle
- **WHEN** the panel opens
- **THEN** no control can turn off the finalizer row (it is a checked, disabled "Always on" row)

#### Scenario: Response order
- **WHEN** the server lists a non-selectable item between two selectable ones
- **THEN** the three rows appear in that order

#### Scenario: Missing depends_on
- **WHEN** an item has no `depends_on` or one that is not an array
- **THEN** its row shows no "Depends on" text

### Requirement: Advanced options request body
The request SHALL never include `options`, so the server default (`finalize` true) applies, and SHALL never include the id of an item whose `selectable` is not `true`. `analyzers` SHALL be omitted when every selectable item is checked, SHALL be the checked selectable ids in list order otherwise (an empty array when none is checked), and SHALL be omitted when the analyzers request failed or the panel was never opened.

#### Scenario: All analyzers checked
- **WHEN** nothing was unchecked
- **THEN** the body has no `analyzers` member

#### Scenario: Subset
- **WHEN** one of two selectable analyzers is unchecked and a non-selectable item is listed
- **THEN** `analyzers` holds only the other selectable id

#### Scenario: None checked
- **WHEN** every selectable analyzer is unchecked
- **THEN** `analyzers` is `[]`

#### Scenario: Final assessment always requested
- **WHEN** a job is submitted in text or link mode, with or without a subset
- **THEN** the body has no `options` member

#### Scenario: Analyzers list fails
- **WHEN** `GET /api/v1/analyzers` fails
- **THEN** the panel shows the error and the next submission has no `analyzers` member

### Requirement: Home fully localized
Every static string of Home, including the panel strings (summary count, Enabled, Disabled, Always on, Final assessment, Depends on, no analyzers configured), SHALL come from the `home` namespace in en, de, fi, fr, ru and ar. The panel SHALL use logical CSS properties so rows mirror under `dir=rtl`, and the submit arrow SHALL mirror too. Changing the locale SHALL keep the typed input, the mode and the open panel.

#### Scenario: Home in Arabic
- **WHEN** Home is rendered in ar with the panel open
- **THEN** html has lang ar and dir rtl and no static Latin-script text other than the brand "VEIL" and the API ids appears

#### Scenario: Input survives a switch
- **WHEN** text is typed and the locale changes
- **THEN** the textarea keeps its value

## ADDED Requirements

### Requirement: Advanced options summary
While the analyzer list is loaded the panel header SHALL show "<enabled> of <total> analyzers enabled", where total counts all items and enabled counts items with `enabled === true`. An empty list SHALL show "No analyzers are configured." and "0 of 0 analyzers enabled".

#### Scenario: Counts
- **WHEN** three items are listed and two have `enabled: true`
- **THEN** the header reads "2 of 3 analyzers enabled"

#### Scenario: Empty list
- **WHEN** the response is `{"items": []}`
- **THEN** "No analyzers are configured." and "0 of 0 analyzers enabled" are shown

### Requirement: Always-on analyzers
An item with `selectable === false` SHALL render as a read-only row whose checkbox is checked and disabled, with the visible label "Always on" tied to the checkbox through `aria-describedby`. An item with `trigger` `after_all_analyzers_settled` SHALL also show a "Final assessment" tag. The row SHALL have no control that turns it off.

#### Scenario: Finalizer row
- **WHEN** the server lists an item with `selectable: false` and `trigger: after_all_analyzers_settled`
- **THEN** its checkbox is checked and disabled, "Always on" and "Final assessment" are shown and clicking it changes nothing

#### Scenario: Other non-selectable row
- **WHEN** an item has `selectable: false` and another trigger
- **THEN** its checkbox is checked and disabled with "Always on" and no "Final assessment" tag

### Requirement: Advanced options states
While the list loads the panel SHALL show "Loading analyzers…" with `role="status"`. On failure it SHALL show `errorMessage(error)` with `role="alert"`. Rows SHALL render only `id`, `name`, `category`, `enabled`, `depends_on`, `trigger` and `selectable` of an item and ignore every other member (tolerant reader).

#### Scenario: Loading
- **WHEN** the request has not completed
- **THEN** the panel shows "Loading analyzers…" with `role="status"`

#### Scenario: Failure
- **WHEN** the request fails with an error envelope
- **THEN** an element with `role="alert"` shows the message and no loading status remains

#### Scenario: Unknown member ignored
- **WHEN** an item has an extra member `extra`
- **THEN** its value appears nowhere on the page
