## Why
`/explore` without a job is an empty placeholder. Shared change `propaganda-map-api` (shared-specs@fa2a80df8674ccbbc6183931e95dbb7d7c8c5b85, junction-2026/project#59) adds `GET /api/v1/map/countries` and `GET /api/v1/map/countries/{code}/analyses`, so `/explore` can show where analyses with detected propaganda techniques come from, by the country of the analyzed page's outlet.

## What Changes
- `/explore` without `job` shows a global map shaded by analysis count (5-step sequential scale, legend), a hover/focus tooltip and a country panel with a paged list of analyses linking to `/jobs/<job_id>`.
- `/explore?job=<id>` and the Region screen are unchanged.
- API client: `getMapCountries()` and `listCountryAnalyses()` with tolerant types in `src/api/mapTypes.ts`.
- `WorldMap` gets optional `fillFor`, `renderTooltip` and `focusable` props; defaults keep today's behaviour.
- New keys in the `explore` namespace for en, fr, ar, de, fi, ru.

## Impact
Frontend only. Reads shared capability `propaganda-map-api` (no shared change). Does not touch Ask (#57) or results/term namespaces (#49).
