## Why
Shared change `history-search-and-excerpt` (shared-specs@d4745c605a5b00999884130a9b08823a04c2c4e9, junction-2026/project#67) adds `q` to `GET /api/v1/jobs` and `excerpt` to JobSummary. The History screen still shows an invented meta line, a disabled mock search and export, and one `getJob` request per item for its excerpt.

## What Changes
- Remove the meta line (ledger index, session, sync state) and every `Mock` wrapper from History.
- Working search: enabled `type=search` input, debounced (300 ms, Enter immediate), sent as `listJobs` `q` together with the status filter; stale answers ignored; a distinct empty state for no match.
- Working Export: pages the full filtered list (`limit=100`) and downloads one `history-YYYY-MM-DD.csv` (UTF-8 BOM, CRLF, RFC 4180, formula-neutralised).
- Excerpts come from `JobSummary.excerpt`; `useExcerpts` and its per-job requests are removed.
- Catalogs (ar, de, en, fi, fr, ru): drop the meta-line and mock-label keys, add `history.empty.search`, `history.exporting`, `history.export_hint`; `docs/mock-areas.md` drops the three `/history` rows.

## Impact
Frontend only; reads the shared capability `analysis-jobs-api` and changes no shared contract. Built against mocked API responses (no backend dependency).
