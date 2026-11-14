## MODIFIED Requirements
### Requirement: Explore and Region screens
`/explore` and `/explore/region` SHALL render an `<h1>` "Explore the world.". On `/explore` nothing SHALL be wrapped in `Mock`: filters, map, tooltip, country panel and list are real (capability `explore-coverage`). On `/explore/region` the selected-region map, the statistics and the region details SHALL each stay wrapped in `Mock` (`data-mock="true"`) and use the typed mock coverage dataset; no other statistic (such as a flagged-propaganda count) is shown.

#### Scenario: Blocks are marked
- **WHEN** `/explore/region` is rendered
- **THEN** the map, statistics and region details each sit inside a `[data-mock="true"]` element

#### Scenario: Explore is not marked
- **WHEN** `/explore` is rendered
- **THEN** its page content has no `[data-mock="true"]` element

### Requirement: Map tooltip
On hover a tooltip SHALL appear near the pointer and hide on leave. It SHALL be white with a 12px radius, a subtle shadow, the app's sans font and comfortable padding, and its position SHALL be clamped inside the map container. It SHALL show the country name with "N articles · M publishers" for covered countries, or the name and "No verified publisher data" otherwise.

#### Scenario: Finland tooltip
- **WHEN** the pointer enters Finland and its coverage is 12 articles and 4 publishers
- **THEN** the tooltip contains "Finland" and "12 articles · 4 publishers" and no text about propaganda

#### Scenario: Uncovered country
- **WHEN** the pointer enters a country without coverage
- **THEN** the tooltip shows its name and "No verified publisher data"

## REMOVED Requirements
### Requirement: Explore filters and state
**Reason**: Explore filters are real now; their state and behaviour are specified in capability `explore-coverage` ("Filter controls", "Single filter pipeline").
**Migration**: See `explore-coverage`.

### Requirement: Explore country panel
**Reason**: The panel now shows real counts, languages and headlines; specified in `explore-coverage` ("Country panel").
**Migration**: See `explore-coverage`.

### Requirement: Explore mock coverage data
**Reason**: `/explore` no longer uses the mock dataset; the module remains only for `/explore/region`.
**Migration**: Geographic data comes from `source_info` through `explore-coverage` ("Verified country", "Aggregation", "Unknown country summary").

### Requirement: Explore empty coverage
**Reason**: The empty-dataset behaviour is covered by the explicit job and analyzer states of `explore-coverage`.
**Migration**: See `explore-coverage` ("Explore without job", "Job states", "News search states", "Geography states").
