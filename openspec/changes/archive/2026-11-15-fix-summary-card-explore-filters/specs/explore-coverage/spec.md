## REMOVED Requirements

### Requirement: Verified fact-checks filter
**Reason**: The Explore screen no longer has filters; fact-checks are always listed.
**Migration**: None; the list and map use all items, narrowed only by a map country click.

### Requirement: Filter controls
**Reason**: The search field, topic, region/country, Languages and Publishers controls are removed.
**Migration**: None; the list and map use all items, narrowed only by a map country click.

## MODIFIED Requirements

### Requirement: Explore without job
With no `job` parameter Explore SHALL show the global propaganda map (Global propaganda map) instead of the per-job coverage view. With a `job` parameter Explore SHALL render the per-job coverage view exactly as before. The mode SHALL be chosen only by the presence of `job`.

#### Scenario: No job
- **WHEN** `/explore` is opened
- **THEN** `GET /api/v1/map/countries` is requested, no job request is sent and the per-job map and Related Coverage are not shown

#### Scenario: With job
- **WHEN** `/explore?job=j1` is opened
- **THEN** only `GET /api/v1/jobs/j1` is requested and the per-job coverage view is shown

### Requirement: Fact-check items
Each fact_check FactCheck with an `http`/`https` `url` SHALL become an ExploreItem with `kind` `fact_check`, title (`title` else `claim`), publisher (`publisher` else `site`), date `review_date`, language, rating (verbatim `rating`), `forClaim` (`for_claim`), `checkedClaim` (`claim`) and `countryCode` null. A news_search Article SHALL never be classified as a fact-check.

#### Scenario: Isolation
- **WHEN** an Article has the same URL as a FactCheck
- **THEN** both exist as separate items of their own kind and both are listed in Related Coverage

### Requirement: Single filter pipeline
One function `filterItems(items, country)` SHALL return all adapter items (articles and fact-checks), narrowed only by the country selected through a map click. The map coverage, tooltips, country panel, Related Coverage list, counts and subtitle SHALL all derive from it, except that map shading SHALL use all items so other countries stay visible. The Related Coverage count SHALL use the article noun for the mixed list.

#### Scenario: Consistent counts
- **WHEN** Finland is selected on the map and has 3 items
- **THEN** the tooltip, the panel, the list count and the subtitle all state the counts of those 3 items

#### Scenario: No filter controls
- **WHEN** Explore renders a loaded job
- **THEN** it SHALL NOT render a search field, topic select, region/country select, Languages or Publishers multi-select or "Verified fact-checks only" toggle: there is no textbox, select, checkbox or `.filters` container and the list shows articles and fact-checks together

### Requirement: Live update
Explore SHALL recompute the adapter output on every polled job update so that the map and list fill in when news_search and source_info settle. Country selection state SHALL be preserved across updates, and a selected country that loses all items SHALL show the uncovered panel.

#### Scenario: Settling while selected
- **WHEN** Finland is selected while source_info is running and the next poll delivers its result
- **THEN** the selection stays and the panel shows Finland's counts

### Requirement: Explore fully localized and isolated
Every static string, placeholder, aria-label, title, tooltip, empty and error state of Explore SHALL come from the catalogs in en, fr, ar, de and fi. Country names SHALL come from `formatCountryName`, counts and plurals from Intl. Article titles, publishers, snippets, claims, topics, provider dates and API codes are source material: they SHALL stay verbatim and be wrapped in `<bdi>`. The country selection SHALL be kept across a locale switch.

#### Scenario: Explore in Arabic
- **WHEN** Explore with a loaded job is rendered in ar
- **THEN** html has dir rtl, labels and notices are Arabic, article titles and publisher names are inside `bdi`, and country names are Arabic

#### Scenario: Locale switch keeps filters
- **WHEN** Finland is selected on the map, then the locale becomes fr
- **THEN** Finland stays selected, the list is unchanged and the panel names it "Finlande"

