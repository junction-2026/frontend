## 1. Adapter and data
- [x] 1.1 `src/explore/model.ts`, `adapter.ts` (`readExplore`, `canonicalUrl`), `filters.ts` (`filterItems`, `aggregateByCountry`, options, topics)
- [x] 1.2 Unit tests: adapter, dedupe, filters, aggregation, fact-check isolation

## 2. UI
- [x] 2.1 Router reads `?job=`; `ExploreView` shows the no-job state or loads the job
- [x] 2.2 Filters, map tooltip text, country panel, Related Coverage, notices and live updates
- [x] 2.3 Results link "Explore coverage"; remove the Explore mocks and update `docs/mock-areas.md`
- [x] 2.4 Component tests for every state, hover, selection, filters, safe links, plain-text snippet, Results href

## 3. Verify
- [x] 3.1 `npm run typecheck` (`tsc -b`), `npm test`, `npm run build`, `scripts/validate-openspec.sh`
