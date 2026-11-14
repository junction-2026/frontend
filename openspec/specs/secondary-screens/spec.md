# secondary-screens Specification

## Purpose
Defines the Explore, Region, Ask, States and Settings screens: their layout and navigation, which parts are mock data marked with MockBadge, and the one backend-connected block (the Settings analyzers list).

## Requirements

### Requirement: Explore and Region screens
`/explore` and `/explore/region` SHALL render an `<h1>` "Explore the world.". On `/explore` nothing SHALL be wrapped in `Mock`: filters, map, tooltip, country panel and list are real (capability `explore-coverage`). On `/explore/region` the selected-region map, the statistics and the region details SHALL each stay wrapped in `Mock` (`data-mock="true"`) and use the typed mock coverage dataset; no other statistic (such as a flagged-propaganda count) is shown.

#### Scenario: Blocks are marked
- **WHEN** `/explore/region` is rendered
- **THEN** the map, statistics and region details each sit inside a `[data-mock="true"]` element

#### Scenario: Explore is not marked
- **WHEN** `/explore` is rendered
- **THEN** its page content has no `[data-mock="true"]` element

### Requirement: Explore and Region navigation
The "Inspect wire feeds →" link in the Explore country panel SHALL navigate to `/explore/region`, and "Clear selection ×" on Region SHALL navigate to `/explore`. Clicking a country on the Explore map SHALL select it and SHALL NOT navigate.

#### Scenario: Navigation between the screens
- **WHEN** the user clicks Finland on Explore, then "Inspect wire feeds →", then "Clear selection ×" on Region
- **THEN** the path stays `/explore` after the click, becomes `/explore/region`, and then `/explore`

### Requirement: Ask screen
`/ask` SHALL render the chat layout (context bar, thread, suggestions, composer) with an `<h1>` starting "Ask Stiriri". The context bar, the thread (including canned answers), the suggestions and the composer SHALL each be wrapped in `Mock` labelled "No backend for Ask Stiriri". Sending a non-blank message SHALL append a user bubble to the thread locally and clear the input; clicking a suggestion SHALL fill the input. The screen SHALL NOT send any network request.

#### Scenario: Send appends a local bubble
- **WHEN** the user types "my question" and submits
- **THEN** a user bubble "my question" appears in the marked thread, the input is empty and no fetch call was made by the screen

#### Scenario: Blank message
- **WHEN** the user submits a blank input
- **THEN** no bubble is added

#### Scenario: Brand kept in every locale
- **WHEN** the locale is `de`, `fr`, `fi` or `ar`
- **THEN** the Ask `<h1>` and mock label contain "Stiriri" verbatim (inflected only by grammar, e.g. fi "Ask Stiririllä")

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

### Requirement: World map component
`WorldMap({ coverage, selected, onSelect, interactive })` SHALL render the world in an Equal Earth projection fitted to its container, in an SVG with a `viewBox` that scales responsively. `coverage` SHALL be `Record<alpha-2 upper case, { name?, articles, publishers, level: 'low'|'medium'|'high' }>`, `selected` an alpha-2 code or null and `onSelect(code|null)` optional. The component SHALL contain no hardcoded statistics.

#### Scenario: Countries rendered
- **WHEN** the map renders
- **THEN** more than 150 country paths exist and Finland has `data-code="FI"`

### Requirement: Map geography source
The geography SHALL be a Natural Earth 110m TopoJSON imported from the frontend sources and bundled by Vite, adding at most 200 KB, with no CDN and no runtime fetch. Each feature SHALL map from its ISO 3166-1 numeric id to alpha-2 through a local table; a feature without an id SHALL render in the no-coverage colour and SHALL NOT be interactive.

#### Scenario: Feature without an ISO id
- **WHEN** a feature has no ISO numeric id (for example Kosovo)
- **THEN** it has no `data-code`, uses the no-coverage colour and ignores hover and click

### Requirement: Map library choice
`react-simple-maps` SHALL be used only if a released version lists React 19 in `peerDependencies`; otherwise `d3-geo` and `topojson-client` SHALL be used. `--legacy-peer-deps`, `--force` and npm overrides of React peer dependencies SHALL NOT be used, and the decision SHALL be recorded in the change's design.

#### Scenario: Decision recorded
- **WHEN** the change is reviewed
- **THEN** `design.md` states the library decision and `package.json` has no overrides

### Requirement: Map container and accessibility
The map container SHALL have `border-radius: 24px`, `overflow: hidden`, `border: 1px solid #E8E8E6`, `background: #F5F9FE` and no box-shadow. The SVG SHALL have `role="img"` and `aria-label="World coverage map"` and the country paths SHALL NOT be tab stops.

#### Scenario: Accessible name
- **WHEN** the map renders
- **THEN** an element with role `img` named "World coverage map" exists and no country path has a `tabindex`

### Requirement: Map palette
Country fills SHALL be `#E9EDF2` (none), `#DCEBFA` (low), `#BFD9F4` (medium), `#9FC4ED` (high), `#A7C9F0` (hover) and `#7FADE5` (selected). Strokes SHALL be `#FFFFFF` at about 0.5px, non-scaling under zoom, about 1px on the hovered country, with mitred joins. Fill and stroke SHALL transition for about 200ms, disabled under `prefers-reduced-motion`.

#### Scenario: Coverage colours
- **WHEN** Finland has level `high` and nothing is hovered or selected
- **THEN** its fill is `#9FC4ED` and a country without coverage is `#E9EDF2`

### Requirement: Map legend
The legend SHALL show None, Low, Medium and High swatches using the four coverage colours.

#### Scenario: Legend entries
- **WHEN** `/explore` is rendered
- **THEN** the legend lists None, Low, Medium and High

### Requirement: Map hover
On pointer enter an interactive country SHALL be highlighted and on leave its base fill SHALL be restored; the selected country keeps the selected colour while hovered.

#### Scenario: Hover colours
- **WHEN** the pointer enters and leaves Finland, and then Finland is selected and hovered
- **THEN** the fill is `#A7C9F0` while hovered, `#9FC4ED` after leaving and `#7FADE5` while selected

### Requirement: Map tooltip
On hover a tooltip SHALL appear near the pointer and hide on leave. It SHALL be white with a 12px radius, a subtle shadow, the app's sans font and comfortable padding, and its position SHALL be clamped inside the map container. It SHALL show the country name with "N articles · M publishers" for covered countries, or the name and "No verified publisher data" otherwise.

#### Scenario: Finland tooltip
- **WHEN** the pointer enters Finland and its coverage is 12 articles and 4 publishers
- **THEN** the tooltip contains "Finland" and "12 articles · 4 publishers" and no text about propaganda

#### Scenario: Uncovered country
- **WHEN** the pointer enters a country without coverage
- **THEN** the tooltip shows its name and "No verified publisher data"

### Requirement: Map selection
Clicking an interactive country SHALL call `onSelect(code)`; clicking the selected country again or pressing Escape (outside inputs and selects) SHALL call `onSelect(null)`. The selected path SHALL have `data-selected="true"` and fill `#7FADE5`. A drag or pinch SHALL NOT select a country.

#### Scenario: Select and deselect
- **WHEN** the user clicks Finland, then clicks it again
- **THEN** Finland is selected, then no path has `data-selected`

### Requirement: Map zoom controls
On `/explore` the map stage SHALL offer "Zoom in", "Zoom out" and "Reset" buttons that zoom by a factor of 1.5 around the centre, clamped to scale 1 to 8, with about 250ms transitions (none under reduced motion). Reset SHALL restore scale 1 and the centre, Zoom in SHALL be disabled at 8 and Zoom out at 1. With `interactive` false no controls or gestures are provided.

#### Scenario: Zoom limits
- **WHEN** the user presses "Zoom in" repeatedly, then "Reset"
- **THEN** the scale grows by 1.5 per press up to 8 where "Zoom in" is disabled, and Reset returns scale 1 with "Zoom out" disabled

### Requirement: Map pan and gestures
Dragging (mouse and touch pointer events) SHALL pan the map and a two-finger pinch SHALL zoom it; panning SHALL be clamped so the map cannot leave the viewport. Wheel over the map SHALL zoom with `preventDefault` on a non-passive listener and the map surface SHALL set `touch-action: none`, so the rest of the page scrolls normally.

#### Scenario: Pan clamped
- **WHEN** the map is zoomed in and dragged far beyond its edge
- **THEN** the translation stops at the map edge and the wheel event is default-prevented

### Requirement: Country select
The Country filter SHALL be a native `<select aria-label="Country">` listing "All regions" and every interactive map country sorted by name, plus a "Clear country" × button while a country is selected. Choosing a country selects it exactly as a map click does and "All regions" clears it.

#### Scenario: Map and select stay in sync
- **WHEN** the user clicks Finland, clears it with "Clear selection", then picks Finland in the Country select
- **THEN** the select shows Finland, then "All regions", then Finland again, and the Finland path is selected after the first and last step

### Requirement: Region map
`/explore/region` SHALL replace its hand-drawn map with the same `WorldMap` using `interactive={false}` and `selected="FI"`, without zoom controls; the rest of the screen is unchanged.

#### Scenario: Static Finland map
- **WHEN** `/explore/region` is rendered
- **THEN** the Finland path has `data-selected="true"`, hover and click do nothing and no zoom button exists

### Requirement: Map responsive layout
The map card and filters SHALL NOT overflow horizontally at a 360px viewport width, the filters SHALL wrap, and the tooltip and the country panel SHALL stay inside the card.

#### Scenario: Narrow viewport
- **WHEN** the viewport is 360px wide
- **THEN** the page has no horizontal scrollbar caused by the map card or filters

### Requirement: Secondary screens localization
All fixed text of Explore (including the world map labels, tooltip and legend), Region, Ask and Settings (including the analyzers block) SHALL come from the `explore`, `ask` and `settings` catalogs in the active locale; every English text quoted in this capability is the `en` catalog value. API-provided strings (analyzer names and categories, article titles, API error messages) SHALL NOT be translated. Switching language SHALL re-render these screens without reload.

#### Scenario: Finnish Explore
- **WHEN** the locale is `fi` and `/explore` is rendered
- **THEN** the heading, the map label and the legend are Finnish

### Requirement: Localized country names and numbers
Country names SHALL be shown with `Intl.DisplayNames` (region) in the active locale and fall back to the previously used English name. Numbers of the Region mock dataset SHALL be formatted with the active locale.

#### Scenario: German Region
- **WHEN** the locale is `de` and `/explore/region` is rendered
- **THEN** the selected region reads "Finnland" and the index coverage reads "99,1 %"

### Requirement: Settings mock under every locale
The Settings tabs and the "Interface & analysis language" block SHALL keep their `Mock` wrapper and `aria-disabled="true"` toggle in every locale; only their text is translated.

#### Scenario: French Settings stays mock
- **WHEN** the locale is `fr` and the user clicks the language toggle on `/settings`
- **THEN** the labels are French, the toggle keeps `aria-checked="true"` and `aria-disabled="true"` and the block is inside a mock element

### Requirement: Secondary screens right-to-left layout
`secondary.css` SHALL use logical properties so the screens mirror under `dir=rtl`; the map SVG SHALL NOT be mirrored.

#### Scenario: Arabic Settings
- **WHEN** the locale is `ar`
- **THEN** the document direction is rtl and the analyzer rows show Arabic labels
