# secondary-screens Specification

## Purpose
Defines the Explore, Region, Ask and States screens: their layout and navigation, and which parts are mock data marked with MockBadge. None of these screens has a backend-connected analyzer block; the analyzer list lives in the Analyze screen (analyze-flow-ui).

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

### Requirement: States screen
`/states` SHALL render the four edge-case cards (input fault, partial results, uncertain result, empty history) as a static showcase with an `<h1>` "Edge Cases & System States". The whole page SHALL be wrapped in `Mock` labelled "Example states". Its links SHALL go only to `/`, `/history` and `/ask`. The "Retry Wire Retrieval" button SHALL be disabled and wrapped in its own `Mock`.

#### Scenario: Static showcase
- **WHEN** `/states` is rendered
- **THEN** the heading is inside a mock element labelled "Example states", every link targets `/`, `/history` or `/ask`, and the Retry Wire Retrieval button is disabled and marked

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
All fixed text of Explore (including the world map labels, tooltip and legend), Region and Ask SHALL come from the `explore` and `ask` catalogs in the active locale; every English text quoted in this capability is the `en` catalog value. API-provided strings (article titles, API error messages) SHALL NOT be translated. Switching language SHALL re-render these screens without reload.

#### Scenario: Finnish Explore
- **WHEN** the locale is `fi` and `/explore` is rendered
- **THEN** the heading, the map label and the legend are Finnish

### Requirement: Localized country names and numbers
Country names SHALL be shown with `Intl.DisplayNames` (region) in the active locale and fall back to the previously used English name. Numbers of the Region mock dataset SHALL be formatted with the active locale.

#### Scenario: German Region
- **WHEN** the locale is `de` and `/explore/region` is rendered
- **THEN** the selected region reads "Finnland" and the index coverage reads "99,1 %"

### Requirement: Secondary screens right-to-left layout
`secondary.css` SHALL use logical properties so the screens mirror under `dir=rtl`; the map SVG SHALL NOT be mirrored.

#### Scenario: Removed Settings path in Arabic (rtl)
- **WHEN** the locale is `ar` and `/settings` is requested
- **THEN** Home is rendered (the page no longer exists) with the document direction rtl

#### Scenario: Arabic Region
- **WHEN** the locale is `ar` and `/explore/region` is rendered
- **THEN** the document direction is rtl and the labels are Arabic

### Requirement: Region without literals
The Region mock (stat cards, wire sources, tags) SHALL take every static string, including proper-noun outlet names, from the catalogs in all six locales. Percentages and outlet names SHALL be isolated with `<bdi>`. Directional glyphs (↗, ⌕) SHALL mirror under `[dir=rtl]`.

#### Scenario: Removed Settings path in Arabic (no Settings text)
- **WHEN** `/settings` is requested in ar
- **THEN** Home is rendered with dir rtl and no Settings text

#### Scenario: Region in Arabic
- **WHEN** Region is rendered in ar
- **THEN** dir is rtl and no static Latin-script text other than the brand appears

### Requirement: World map customization
`WorldMap` SHALL accept optional `fillFor(code)`, `renderTooltip(code)` and `focusable` props. `fillFor` returns the base fill of a country (undefined keeps the default coverage fill). `renderTooltip` returns the tooltip content shown on hover and focus. When the props are omitted, fills, tooltip and behaviour SHALL be exactly as before, including country paths that are not tab stops.

#### Scenario: Custom fill and tooltip
- **WHEN** `fillFor` returns `#123456` for `DE` and `renderTooltip` returns "Hi"
- **THEN** the `DE` path has fill `#123456` and hovering it shows a tooltip "Hi"

#### Scenario: Defaults
- **WHEN** none of the props is passed
- **THEN** no country path has a `tabindex` and the coverage tooltip is unchanged

### Requirement: Focusable map countries
With `focusable`, every interactive country SHALL have `tabIndex` 0, an `aria-label` with its name and `aria-describedby` pointing at the tooltip while it is shown, Enter and Space SHALL act as a click, and focus SHALL show the tooltip. The SVG SHALL then have `role="group"` with the same `aria-label`, because the children of an `img` are presentational.

#### Scenario: Keyboard
- **WHEN** `focusable` is set, `DE` receives focus and Enter is pressed
- **THEN** the tooltip is shown, the path has `aria-describedby` of the tooltip and `onSelect('DE')` is called
