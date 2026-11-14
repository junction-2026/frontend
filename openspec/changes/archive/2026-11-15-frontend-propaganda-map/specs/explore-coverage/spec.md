## MODIFIED Requirements

### Requirement: Explore without job
With no `job` parameter Explore SHALL show the global propaganda map (Global propaganda map) instead of the per-job coverage view. With a `job` parameter Explore SHALL render the per-job coverage view exactly as before. The mode SHALL be chosen only by the presence of `job`.

#### Scenario: No job
- **WHEN** `/explore` is opened
- **THEN** `GET /api/v1/map/countries` is requested, no job request is sent and the per-job filters are not shown

#### Scenario: With job
- **WHEN** `/explore?job=j1` is opened
- **THEN** only `GET /api/v1/jobs/j1` is requested and the per-job coverage view is shown

## ADDED Requirements

### Requirement: Global propaganda map
In global mode the map SHALL be shaded from `GET /api/v1/map/countries` with a 5-step sequential single-hue scale computed client-side over `1..max(items[].analyses)` (log-scaled buckets when the maximum is above 5). The scale SHALL be monotonic: a higher count never gets a lighter step. A country with zero analyses or absent from `items` SHALL keep the existing "none" fill. A legend SHALL show the steps with their count ranges.

#### Scenario: Shading
- **WHEN** the response has `DE` with 1 analysis and `RU` with 10
- **THEN** `RU` has a darker fill than `DE`, `FR` has the none fill and the legend lists the ranges

#### Scenario: Monotonic scale
- **WHEN** the scale is built for any maximum from 1 to 5000
- **THEN** the step index never decreases as the count grows and the maximum gets the last step

### Requirement: Global map legend contrast
The last legend step SHALL have at least 3:1 contrast against the map background and the first and last steps SHALL differ by at least 3:1.

#### Scenario: Contrast
- **WHEN** the scale colours are checked
- **THEN** first versus last step and last step versus `#F5F9FE` are both at least 3:1

### Requirement: Global map tooltip
Hovering or keyboard-focusing a country SHALL show a tooltip with the country name localized for `country_code` (falling back to the server `country`, then to the code), the count worded as analyses of pages from outlets in that country (never as propaganda by the country or as a rating of it) and up to 3 technique display names with their counts. A country without analyses SHALL say so. Server strings SHALL be plain text.

#### Scenario: Tooltip content
- **WHEN** `RU` has 2 analyses and techniques Loaded Language (2), Doubt (1), Repetition (1), Flag-Waving (1)
- **THEN** the tooltip shows "2 analyses of pages from outlets in Russia" and the first three techniques with counts, not the fourth

### Requirement: Country panel of analyses
Clicking, pressing Enter or Space on, or tapping a country SHALL open a labelled panel that requests the first page (`limit` 20) of `GET /api/v1/map/countries/{code}/analyses`. Escape or the close button SHALL close the panel and return focus to the country. "Load more" SHALL be offered while `next_cursor` is non-null and append the next page.

#### Scenario: Paging
- **WHEN** the first page has `next_cursor: "c2"` and the user activates "Load more"
- **THEN** `?cursor=c2&limit=20` is requested, its items are appended and "Load more" disappears when `next_cursor` is null

#### Scenario: Close returns focus
- **WHEN** the panel was opened from the focused Germany path and Escape is pressed
- **THEN** the panel closes and Germany has focus

### Requirement: Country panel items
Each panel item SHALL show its title (or snippet when the title is null), the outlet name, the localized `created_at` date, a chip per technique (a strength badge only when `strength` is present) and the verdict, and SHALL link to the job result route by `job_id`. All server strings SHALL be plain text.

#### Scenario: Item content
- **WHEN** an item has `title: null`, a technique without `strength` and `verdict: null`
- **THEN** the snippet is the link text, the chip has no strength badge and no verdict is shown

### Requirement: Global map states
Both requests SHALL show a loading skeleton, and on failure an error with a Retry button that repeats that request. With `analyses` 0 the map SHALL explain that only analyses of pages from known outlets with detected techniques appear. A country with no analyses SHALL show an empty panel state.

#### Scenario: Retry
- **WHEN** the countries request fails and Retry is pressed
- **THEN** the request is sent again and the map is shown on success

#### Scenario: Empty map
- **WHEN** the response is `{ items: [], analyses: 0 }`
- **THEN** the empty-state explanation is shown
