## Pipeline
`GET /api/v1/jobs/{id}` (`useJob`, 2 s polling) → `readExplore(job)` (tolerant reader, pure, never throws) → `ExploreItem[]` → `filterItems(items, filters)` → `aggregateByCountry` → WorldMap, tooltip, country panel, Related Coverage, counts, subtitle. The adapter is recomputed on every polled job (`useMemo` on the job object); filter and selection state live in a component that stays mounted across updates.

## Decisions
- **Country** comes only from `source_info.articles[i].outlet.country_code`, joined by index and verified by equal `url` and `matched: true`. Anything else is "Country unknown" and never mapped.
- **Map shading ignores the country filter** (`filterItems` with `country: null`) so other countries stay visible while one is selected; the panel, list, counts and subtitle use the fully filtered output.
- **Topic select vs fact-checks**: fact-checks are not found by a search query, so the Topic select does not apply to them; free text matches title, snippet and `for_claim`.
- **Levels** are relative to the maximum article count of the dataset being shaded (high > 2/3, medium > 1/3, else low).
- **Run status** of an unknown value is `pending` while the job runs and `skipped` once it is done; a `succeeded` run whose result cannot be read counts as `failed` (`unreadable_result`).
- **Retry** remounts the job request by changing a React key; no new hook.
- The `route` keeps the name `explore`; `matchRoute(pathname, search)` returns `id` from `?job=`.
