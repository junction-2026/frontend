## MODIFIED Requirements

### Requirement: Global map tooltip
A hovered or keyboard-focused country SHALL show a tooltip with its localized name (falling back to the server `country`, then the code), the count worded "N analyses associated with <country>" in every locale (singular and plural; never outlet-only, nor propaganda by the country, nor a rating) and up to 3 technique display names with counts. A country without analyses SHALL say so. Server strings SHALL be plain text with `<bdi>`.

#### Scenario: Tooltip content
- **WHEN** `RU` has 2 analyses and techniques Loaded Language (2), Doubt (1), Repetition (1), Flag-Waving (1)
- **THEN** the tooltip shows "2 analyses associated with Russia" and the first three techniques with counts, not the fourth

#### Scenario: Singular
- **WHEN** `DE` has 1 analysis
- **THEN** the tooltip shows "1 analysis associated with Germany"

### Requirement: Country panel items
Each panel item SHALL show its title (or snippet when the title is null), the outlet name only when `outlet` is non-null, the localized date, technique chips (a strength badge only when `strength` is present) and the verdict, and SHALL link to the job by `job_id`; an empty `source.url` SHALL never be rendered. Server strings, `countries[].country` included, SHALL be plain text with `<bdi>`.

#### Scenario: Item content
- **WHEN** an item has `title: null`, a technique without `strength` and `verdict: null`
- **THEN** the snippet is the link text, the chip has no strength badge and no verdict is shown

#### Scenario: Multi-country item
- **WHEN** the `RU` panel lists an item with `countries` `RU` and `UA`
- **THEN** it shows "Also associated with: Ukraine" and not Russia

#### Scenario: Pasted text item
- **WHEN** an item has `outlet: null` and `source: {"url": "", "title": null}`
- **THEN** no outlet line and no URL text is shown, and the link still targets `/jobs/<job_id>`


### Requirement: Global map states
Both requests SHALL show a loading skeleton, and on failure an error with a Retry button that repeats that request. With `analyses` 0 the map SHALL explain that only analyses with detected techniques that could be associated with a country appear. A country with no analyses SHALL show an empty panel state. The subtitle SHALL use the top-level `analyses` and SHALL NOT sum `items[].analyses`.

#### Scenario: Retry
- **WHEN** the countries request fails and Retry is pressed
- **THEN** the request is sent again and the map is shown on success

#### Scenario: Empty map
- **WHEN** the response is `{ items: [], analyses: 0 }`
- **THEN** the empty-state explanation is shown

#### Scenario: Distinct count
- **WHEN** the response has `analyses: 1` and two items with `analyses: 1` each
- **THEN** the subtitle says 1 analysis, not 2

## ADDED Requirements

### Requirement: Other associated countries
When an item's `countries` has more than the panel's country, the item SHALL show "Also associated with: <names>" listing the other countries as plain text, each name localized for its `country_code`, else the server `country`, else the code. `readAnalyses` SHALL read `countries` as MapCountry `{country_code, country, basis}`, ignoring unknown `basis` values and dropping entries without a `country_code`.

#### Scenario: Unknown basis
- **WHEN** a `countries` entry has `basis` `["outlet", "future"]`
- **THEN** `readAnalyses` keeps the entry and ignores `future`; an entry without `country_code` is dropped

### Requirement: Map wording
The lede, map title, map note and notice SHALL describe a country as one an analysis is associated with (the analyzed page's outlet or its content), in every locale. They SHALL NOT call it the outlet's country only, the origin, author or target of the propaganda, or a rating.

#### Scenario: Lede
- **WHEN** the English lede is read
- **THEN** it speaks of the country an analysis is associated with and does not say the analysis is placed in the outlet's country
