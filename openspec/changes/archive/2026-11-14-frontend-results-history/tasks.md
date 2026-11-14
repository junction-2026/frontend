## 1. Job data
- [x] 1.1 `src/job/useJob.ts` on `getJob` (poll 2000 ms, 404 and envelope errors), `src/job/read.ts` readers; remove `src/job/api.ts`
## 2. Results
- [x] 2.1 `ResultsView`: meta row, excerpt, verdict card, finalization and job states, technique tags, coverage and analyzer rows, mock parts
## 3. Detail
- [x] 3.1 `DetailView`: metrics bar; `src/job/JobView.tsx` restyled (ID badge, no match percentage); `JobView.test.tsx` migrated to `src/job/Detail.test.tsx`
## 4. History
- [x] 4.1 `src/history/` hooks (pagination, filter, excerpt queue), `HistoryView`
## 5. Docs and validation
- [x] 5.1 Append rows to `docs/mock-areas.md`
- [x] 5.2 `npm run lint`, `npm test`, `npm run build`, `scripts/validate-openspec.sh`
