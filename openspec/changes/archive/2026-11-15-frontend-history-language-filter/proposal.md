## Why
Shared change `history-language-filter` (shared-specs@4d2ab1830d2d2c7f7e4ac1592e17f2dc33307aec, parent junction-2026/project#80) adds a `language` filter to `GET /api/v1/jobs` and a `language` member to JobSummary. The History screen should let users filter by it and show each item's language.

## What Changes
- `listJobs` accepts `language`; `JobSummary.language?: string | null`.
- History filter bar: single-select language control (All, 13 fixed languages, Unknown), kept with status and q in the `/history` URL.
- Each item shows a language label; CSV export applies the filter and gains a `language` column.
- New keys only in the `history` i18n namespace, in every locale.
- No shared-spec change requested; the shared contract is consumed as approved.

## Impact
Frontend only: `src/api`, `src/history`, `src/views/HistoryView.tsx`, `src/i18n` (formatter + `history` catalogs) and tests. Touches only the History filter bar and the `history` namespace, so it stays independent of project#76 and #81.
