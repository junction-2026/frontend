## 1. API
- [x] 1.1 `listJobs` `language` parameter; `JobSummary.language`
## 2. History
- [x] 2.1 `useHistory` and `fetchAllJobs` take `language`; CSV column
- [x] 2.2 Language select, URL round-trip, item label, empty state with clear-filters
## 3. i18n
- [x] 3.1 `history.language.*`, `history.empty.language`, `history.clear_filters` in all locales; `formatLanguageName`
## 4. Tests and checks
- [x] 4.1 Client, HistoryView tests
- [x] 4.2 `npm run lint`, `npm test`, `npm run build`, `scripts/validate-openspec.sh`
