## Why
Explore (`/explore`) shows invented coverage numbers. The backend now returns real `news_search`, `source_info` and `fact_check` results on every analysis job (project#37), so the world map, country panel, filters and a Related Coverage list can be driven by them.

## What Changes
- `/explore?job=<id>` loads that job with the existing `useJob` polling and renders real articles, publishers, languages, dates and verified outlet countries.
- New `src/explore/*` (adapter, model, one filter function, geographic aggregation, components); the mock coverage dataset is no longer used by `/explore` (it stays for `/explore/region`).
- The Results link "Cross-source coverage →" becomes "Explore coverage" and opens `/explore?job=<id>`.
- The "Explore filters" and "Coverage map" `Mock` wrappers and their rows in `docs/mock-areas.md` are removed; `/explore/region` stays mock.
- Frontend only: no backend change and no shared-spec change (pinned shared-specs `2463f0290862b5267cd298c35eb73d35b45e8f2c`: news-search-result, source-info-result, fact-check-result, topic-extraction-result, analysis-jobs-api).

## Impact
`src/views/ExploreView.tsx`, `src/explore/*`, `src/router.tsx`, `src/job/Verdict.tsx`, `src/secondary/WorldMap.tsx` (tooltip text), `src/secondary/worldMapData.ts`, `docs/mock-areas.md`. Region, Analyze, History, Results and Detail are otherwise unchanged.
