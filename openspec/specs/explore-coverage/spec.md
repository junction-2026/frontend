# explore-coverage Specification

## Purpose
Defines how the Explore screen turns the news_search, source_info and fact_check results of one analysis job into a world map, country panel, filters and a Related Coverage list, and which states it shows while those results settle.

## Requirements

### Requirement: Explore job source
`/explore` SHALL read an optional `job` query parameter (the router keeps the route name `explore`; the id is URL-decoded and a malformed escape counts as absent) and load that job with the existing `useJob` hook (`GET /api/v1/jobs/{id}`, polled every 2 s until terminal). It SHALL NOT create jobs, cancel jobs or call any other endpoint.

#### Scenario: Job loaded once
- **WHEN** `/explore?job=a%20b` is opened
- **THEN** exactly one `GET /api/v1/jobs/a%20b` is sent and no other job request

#### Scenario: Malformed escape
- **WHEN** `/explore?job=%E0%A4%A` is opened
- **THEN** Explore behaves as without a job

### Requirement: Explore without job
With no `job` parameter Explore SHALL show the global propaganda map (Global propaganda map) instead of the per-job coverage view. With a `job` parameter Explore SHALL render the per-job coverage view exactly as before. The mode SHALL be chosen only by the presence of `job`.

#### Scenario: No job
- **WHEN** `/explore` is opened
- **THEN** `GET /api/v1/map/countries` is requested, no job request is sent and the per-job filters are not shown

#### Scenario: With job
- **WHEN** `/explore?job=j1` is opened
- **THEN** only `GET /api/v1/jobs/j1` is requested and the per-job coverage view is shown

### Requirement: Explore adapter
A pure function `readExplore(job)` in `src/explore/adapter.ts` SHALL validate the `news_search`, `source_info`, `fact_check` and `topic_extraction` AnalyzerRuns as tolerant readers (unknown members ignored, wrong types dropped per item, never throwing) and return `{ newsStatus, geoStatus, factStatus, queries, items, unknownCountry }`.

#### Scenario: Junk input
- **WHEN** `analyzers` is missing, `null` or holds non-objects and results of the wrong type
- **THEN** `readExplore` returns no items and the statuses `missing` or `failed`, without throwing

### Requirement: Article item
Each news_search Article with a non-empty string `title` and an `http`/`https` `url` SHALL become an ExploreItem `{ id, kind: 'article', title, url, domain, publisher, date, language, snippet, query, origin, countryCode, countryName, outletName }` (at least; further members are allowed) where missing optional fields are null. Invalid entries SHALL be dropped.

#### Scenario: Invalid entries
- **WHEN** articles have an empty title, a `javascript:` URL or are not objects
- **THEN** only the valid articles become items

### Requirement: Stable id and dedupe
`ExploreItem.id` SHALL be the canonical URL (scheme and host lower-cased, one leading `www.` removed from the host, fragment removed, trailing `/` of a non-root path removed). Items of one kind with the same canonical URL SHALL be merged, keeping the first.

#### Scenario: Same article twice
- **WHEN** `https://www.a.example/p#x` and `https://A.EXAMPLE/p/` are both listed
- **THEN** one item remains, the first

### Requirement: Publisher
An item's publisher SHALL be the matched Outlet `name`, else Article `source`, else Article `domain`. Distinct-publisher counts SHALL count distinct Outlet `domain` for matched items and distinct Article `domain` otherwise.

#### Scenario: Publisher fallback
- **WHEN** an article is matched, one has only `source` and one neither
- **THEN** their publishers are the Outlet name, the source and the domain

### Requirement: Verified country
An item's `countryCode` SHALL be source_info `articles[i].outlet.country_code` only when source_info succeeded, `articles[i].matched` is true, `articles[i].url` equals the Article `url` and the code is two upper-case letters; otherwise null. Language, domain TLD, snippet text and `summary.countries` SHALL NOT be used to infer a country.

#### Scenario: Index and url mismatch
- **WHEN** `articles[1].url` differs from the second Article's url, or the code is empty or lower-case
- **THEN** that item has no country

### Requirement: Country names
A covered country's display name SHALL be the Outlet `country` when non-empty, else the bundled map name, else the code.

#### Scenario: Empty Outlet country
- **WHEN** an outlet has `country_code` `DE` and `country` `""`
- **THEN** the country is named "Germany"

### Requirement: Fact-check items
Each fact_check FactCheck with an `http`/`https` `url` SHALL become an ExploreItem with `kind` `fact_check`, title (`title` else `claim`), publisher (`publisher` else `site`), date `review_date`, language, rating (verbatim `rating`), `forClaim` (`for_claim`), `checkedClaim` (`claim`) and `countryCode` null. A news_search Article SHALL never be classified as a fact-check.

#### Scenario: Isolation
- **WHEN** an Article has the same URL as a FactCheck
- **THEN** both exist as separate items of their own kind and only the FactCheck is listed with the filter on

### Requirement: Verified fact-checks filter
Fact-check items SHALL be shown only while the "Verified fact-checks only" filter is on, and that filter SHALL be enabled only when fact_check succeeded with at least one FactCheck.

#### Scenario: No fact-checks
- **WHEN** fact_check is missing, failed or has no FactCheck
- **THEN** the filter is disabled

### Requirement: Single filter pipeline
One function `filterItems(items, filters)` SHALL apply topic/query (the SearchQuery `original` the item was found by, or a free-text match on title and snippet), language, publisher, country and verified-only. The map coverage, tooltips, country panel, Related Coverage list, result counts and subtitle SHALL all derive from its output; the country filter is excluded only for map shading so other countries stay visible.

#### Scenario: Consistent counts
- **WHEN** a language filter leaves 3 articles from Finland
- **THEN** the tooltip, the panel, the list count and the subtitle all state 3 articles for Finland

### Requirement: Aggregation
`aggregateByCountry(items)` SHALL return per alpha-2 code `{ name, articles, publishers, languages, level }`. The level SHALL be relative to the maximum article count in the dataset (high above 2/3 of the maximum, medium above 1/3, else low) and no entry SHALL exist for a country with zero items.

#### Scenario: Levels
- **WHEN** countries have 9, 5, 3 and 2 articles
- **THEN** their levels are high, medium, low and low

### Requirement: Filter controls
Topic SHALL be a select of the job's distinct SearchQuery `original` values ("All topics" by default) beside a text field for free-text search; Languages and Publishers SHALL be multi-selects populated only from values present in the items with their counts. A filter with no backing values SHALL be disabled and labelled "No data".

#### Scenario: No languages
- **WHEN** no item has a language
- **THEN** the Languages control is disabled and reads "Languages: No data"

### Requirement: Map tooltip data
Hovering a covered country SHALL show the white rounded tooltip with the country name and "N articles · M publishers" from the filtered aggregation; an uncovered country SHALL show "No verified publisher data". The existing palette, animation and tooltip styling SHALL be kept.

#### Scenario: Covered and uncovered
- **WHEN** the pointer enters Finland (2 articles, 2 publishers) and then France (none)
- **THEN** the tooltips read "2 articles · 2 publishers" and "No verified publisher data"

### Requirement: Country panel
A selected country SHALL show its name, article count, distinct publishers, distinct languages and up to 5 headlines with publisher and date; an uncovered selection SHALL show "No verified publisher data for <name>". "Clear selection" SHALL restore the global view without a new request, and "Inspect wire feeds →" SHALL still navigate to the mock `/explore/region`.

#### Scenario: Select and clear
- **WHEN** the user clicks Finland and then "Clear selection"
- **THEN** the list is filtered to Finland and then shows all items again, and no new request was sent

### Requirement: Related Coverage list
A card list below the map SHALL render the filtered items with all text as plain text (no HTML or Markdown). The title SHALL link to `url` only for `http`/`https` with `target="_blank"` and `rel="noopener noreferrer"`, the date SHALL be shown verbatim, null fields SHALL be omitted, and an item without a verified country SHALL carry a "Country unknown" tag. Fact-check items SHALL additionally show their rating and the claims per "Fact-check claim presentation".

#### Scenario: Markup in a snippet
- **WHEN** a snippet is `<img src=x onerror=alert(1)>`
- **THEN** those characters are shown literally and no `img` element exists

### Requirement: Fact-check claim presentation
A card SHALL say "Fact-check of: <for_claim>" only when the FactCheck `claim` equals `for_claim` after a trimmed, case-insensitive comparison. Otherwise it SHALL show "Similar claim reviewed: <claim>" followed by "Found for: <for_claim>", and only "Found for: <for_claim>" when no `claim` was sent, because a provider match is a similar checked claim (shared fact-check-result).

#### Scenario: Similar claim
- **WHEN** a FactCheck has `claim` "Rente mit 70 beschlossen" and `for_claim` "Rente ab 70"
- **THEN** its card shows its rating, "Similar claim reviewed: Rente mit 70 beschlossen" and "Found for: Rente ab 70", and no "Fact-check of" text

#### Scenario: Same claim
- **WHEN** `claim` and `for_claim` differ only in case or surrounding whitespace
- **THEN** the card shows "Fact-check of: <for_claim>"

### Requirement: Unknown country summary
The map card subtitle SHALL read "<P> publishers across <C> countries · <U> articles with country unknown" from the filtered data, the last part only when U is greater than 0 (singular forms are used for 1).

#### Scenario: Subtitle
- **WHEN** the filtered data has 3 publishers in 2 countries and 1 article without a country
- **THEN** the subtitle reads "3 publishers across 2 countries · 1 article with country unknown"

### Requirement: Topic context
The page head SHALL show the job's searched topics (SearchQuery `original` values, distinct, origin `topic` first) and a link back to `/jobs/<id>`.

#### Scenario: Topics shown
- **WHEN** queries originate from topics "A" and news "B"
- **THEN** the head lists "A · B" and links to `/jobs/<id>`

### Requirement: Job states
Explore SHALL render distinct states for a loading skeleton, a 404 ("Job not found"), a network or API error through `ErrorAlert` with Retry, and a failed or cancelled job (with whatever results exist).

#### Scenario: Not found
- **WHEN** the job request answers 404
- **THEN** "Job not found" is shown without a Retry button

### Requirement: News search states
Explore SHALL render distinct states for news_search: pending or running ("Searching news coverage…"), missing ("Coverage search is not available for this analysis"), skipped (the reason is shown), failed (the error code is shown, never "no coverage exists") and succeeded with zero articles ("No related articles were found", not evidence a claim is false).

#### Scenario: Search failed
- **WHEN** news_search is `failed` with `error.code` `adapter_error`
- **THEN** "Coverage search failed (error code: adapter_error)" is shown and no claim of absent coverage

#### Scenario: Zero articles
- **WHEN** news_search succeeded with `articles: []`
- **THEN** "No related articles were found" is shown with a note that this is not evidence a claim is false

### Requirement: Geography states
For source_info Explore SHALL show "Matching publishers…" while it is pending or running, and "Geographic data unavailable for this analysis" when it is missing, skipped or failed or when no country was verified; the article list keeps working.

#### Scenario: Geography unavailable
- **WHEN** source_info is `failed` and news_search returned articles
- **THEN** the articles are listed, the map has no coverage and "Geographic data unavailable for this analysis" is shown

### Requirement: Live update
Explore SHALL recompute the adapter output on every polled job update so that the map and list fill in when news_search and source_info settle. Filter and selection state SHALL be preserved across updates, and a selected country that loses all items SHALL show the uncovered panel.

#### Scenario: Settling while selected
- **WHEN** Finland is selected while source_info is running and the next poll delivers its result
- **THEN** the selection stays and the panel shows Finland's counts

### Requirement: Design kept
The 24px rounded map container, pastel-blue coverage levels, hover and selection behaviour, zoom and pan, legend, Inter typography and light-mode styling SHALL be unchanged, and the legend notice about publisher bureaus SHALL stay.

#### Scenario: Legend notice
- **WHEN** Explore renders with or without a job
- **THEN** the legend lists None, Low, Medium and High and the publisher-bureau notice

### Requirement: Explore fully localized and isolated
Every static string, placeholder, aria-label, title, tooltip, empty and error state of Explore SHALL come from the catalogs in en, fr, ar, de and fi. Country names SHALL come from `formatCountryName`, counts and plurals from Intl. Article titles, publishers, snippets, claims, topics, provider dates and API codes are source material: they SHALL stay verbatim and be wrapped in `<bdi>`. The filters (text, topic, country, languages, publishers, verified) SHALL be kept across a locale switch.

#### Scenario: Explore in Arabic
- **WHEN** Explore with a loaded job is rendered in ar
- **THEN** html has dir rtl, labels and notices are Arabic, article titles and publisher names are inside `bdi`, and country names are Arabic

#### Scenario: Locale switch keeps filters
- **WHEN** the country filter is Finland and the search text is "grid", then the locale becomes fr
- **THEN** the same country and text stay selected, the list is unchanged and the country option reads "Finlande"

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
A hovered or keyboard-focused country SHALL show a tooltip with its localized name (falling back to the server `country`, then the code), the count worded "N analyses associated with <country>" in every locale (singular and plural; never outlet-only, nor propaganda by the country, nor a rating) and up to 3 technique display names with counts. A country without analyses SHALL say so. Server strings SHALL be plain text with `<bdi>`.

#### Scenario: Tooltip content
- **WHEN** `RU` has 2 analyses and techniques Loaded Language (2), Doubt (1), Repetition (1), Flag-Waving (1)
- **THEN** the tooltip shows "2 analyses associated with Russia" and the first three techniques with counts, not the fourth

#### Scenario: Singular
- **WHEN** `DE` has 1 analysis
- **THEN** the tooltip shows "1 analysis associated with Germany"

### Requirement: Country panel of analyses
Clicking, pressing Enter or Space on, or tapping a country SHALL open a labelled panel that requests the first page (`limit` 20) of `GET /api/v1/map/countries/{code}/analyses`. Escape or the close button SHALL close the panel and return focus to the country. "Load more" SHALL be offered while `next_cursor` is non-null and append the next page.

#### Scenario: Paging
- **WHEN** the first page has `next_cursor: "c2"` and the user activates "Load more"
- **THEN** `?cursor=c2&limit=20` is requested, its items are appended and "Load more" disappears when `next_cursor` is null

#### Scenario: Close returns focus
- **WHEN** the panel was opened from the focused Germany path and Escape is pressed
- **THEN** the panel closes and Germany has focus

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
