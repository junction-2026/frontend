## 1. API client
- [x] 1.1 `JobSummary.excerpt?: string | null`; `listJobs` accepts `q` and sends it only when non-empty
## 2. History
- [x] 2.1 `useHistory(status, q)`; remove `useExcerpts`; excerpts from `JobSummary.excerpt`
- [x] 2.2 `src/history/exportCsv.ts` (paging, CSV, download); remove meta line and `Mock` wrappers in `HistoryView`; search input and Export button
## 3. i18n and docs
- [x] 3.1 Catalog keys in all six locales; `docs/mock-areas.md` rows removed
## 4. Tests and checks
- [x] 4.1 Tests for search, load more with q, clearing, no-match, export paging/CSV/quoting/formulas/empty/error, meta line absent in all locales
- [x] 4.2 `npm test`, `npm run lint`, `npx tsc -b`, `scripts/validate-openspec.sh`
