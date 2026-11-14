# secondary-screens Specification

## Purpose
Defines the Explore, Region, Ask, States and Settings screens: their layout and navigation, which parts are mock data marked with MockBadge, and the one backend-connected block (the Settings analyzers list).

## Requirements

### Requirement: Explore and Region screens
`/explore` and `/explore/region` SHALL render the mock layout (filters, coverage map, publisher distribution and legend; selected-region map, statistics and region details) as React components with an `<h1>` "Explore the world.". Each data block (filters, map card, statistics, region details panel) SHALL be wrapped in `Mock`.

#### Scenario: Blocks are marked
- **WHEN** `/explore` or `/explore/region` is rendered
- **THEN** the filters, map card, statistics and region details each sit inside a `[data-mock="true"]` element

### Requirement: Explore and Region navigation
The Finland area and the "Click country to inspect wire feeds" link on Explore SHALL navigate to `/explore/region`, and "Clear selection" on Region SHALL navigate to `/explore`.

#### Scenario: Navigation between the screens
- **WHEN** the user activates the Finland link on Explore, then "Clear selection ×" on Region
- **THEN** the path becomes `/explore/region` and then `/explore`

### Requirement: Ask screen
`/ask` SHALL render the chat layout (context bar, thread, suggestions, composer) with an `<h1>` starting "Ask VEIL". The context bar, the thread (including canned answers), the suggestions and the composer SHALL each be wrapped in `Mock` labelled "No backend for Ask VEIL". Sending a non-blank message SHALL append a user bubble to the thread locally and clear the input; clicking a suggestion SHALL fill the input. The screen SHALL NOT send any network request.

#### Scenario: Send appends a local bubble
- **WHEN** the user types "my question" and submits
- **THEN** a user bubble "my question" appears in the marked thread, the input is empty and no fetch call was made by the screen

#### Scenario: Blank message
- **WHEN** the user submits a blank input
- **THEN** no bubble is added

### Requirement: States screen
`/states` SHALL render the four edge-case cards (input fault, partial results, uncertain result, empty history) as a static showcase with an `<h1>` "Edge Cases & System States". The whole page SHALL be wrapped in `Mock` labelled "Example states". Its links SHALL go only to `/`, `/history` and `/ask`. The "Retry Wire Retrieval" button SHALL be disabled and wrapped in its own `Mock`.

#### Scenario: Static showcase
- **WHEN** `/states` is rendered
- **THEN** the heading is inside a mock element labelled "Example states", every link targets `/`, `/history` or `/ask`, and the Retry Wire Retrieval button is disabled and marked

### Requirement: Settings screen
`/settings` SHALL render an `<h1>` "Settings & Methodology", the tabs (Interface & Language, Analyzers & Ensembles, Accessibility, Epistemic Framework, Data Retention) and the "Interface & analysis language" block. The tabs and that block SHALL each be wrapped in `Mock`, and their toggles SHALL be non-functional (`aria-disabled="true"`, state unchanged by clicks). The Accessibility, Epistemic Framework and Data Retention sections exist only as tabs, as in the mock.

#### Scenario: Mock settings
- **WHEN** `/settings` is rendered
- **THEN** the tabs and the language block are inside mock elements and clicking the toggle does not change `aria-checked`

### Requirement: Settings analyzers block
The "Active AI analyzers & ensembles" block SHALL call `GET /api/v1/analyzers` once and list its items, and SHALL NOT be wrapped in `Mock`. The header SHALL show the pill "● <enabled> of <total> analyzers enabled".

#### Scenario: Request and no mark
- **WHEN** `/settings` is rendered
- **THEN** `GET /api/v1/analyzers` is requested and the block is not inside a mock element

### Requirement: Settings analyzer rows
Each analyzer row SHALL show the `name`, the `id` as a badge, the `category`, the `depends_on` when non-empty, a "Final assessment" tag when `trigger` is `after_all_analyzers_settled`, a "Not selectable" tag when `selectable` is false, and a read-only status pill "Enabled" or "Disabled" (no toggle).

#### Scenario: Items listed
- **WHEN** the response holds an enabled analyzer, a disabled analyzer with `depends_on` and a finalizer with `trigger: after_all_analyzers_settled`
- **THEN** rows show "Enabled", "Disabled" and the "Final assessment" tag respectively, and the header reads "● 2 of 3 analyzers enabled"

### Requirement: Settings analyzers tolerant reader
The analyzers block SHALL render only `id`, `name`, `category`, `enabled`, `depends_on`, `trigger` and `selectable` of an item and ignore any other member.

#### Scenario: Unknown member ignored
- **WHEN** an item has an extra member `extra`
- **THEN** its value appears nowhere on the page

### Requirement: Settings analyzers states
While the analyzers request is pending the block SHALL show text with `role="status"`; on failure it SHALL show the error message from the API error envelope (via `errorMessage`) with `role="alert"`; an empty list SHALL show "No analyzers are configured.".

#### Scenario: Loading
- **WHEN** the request has not completed
- **THEN** the block shows "Loading analyzers…" with `role="status"`, unmarked

#### Scenario: Empty list
- **WHEN** the response is `{"items": []}`
- **THEN** "No analyzers are configured." and "● 0 of 0 analyzers enabled" are shown

#### Scenario: Error envelope
- **WHEN** the request fails with an error envelope whose code is unknown to the client
- **THEN** an element with `role="alert"` shows the envelope's `message` and no loading status remains in the block
