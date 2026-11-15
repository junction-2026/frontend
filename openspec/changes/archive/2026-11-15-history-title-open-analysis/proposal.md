## Why
A History item's title is plain text and the action link says "Reopen Analysis →", although it opens the analysis. Parent: junction-2026/project#72.

## What Changes
- The item title (h3) contains a router link to `/jobs/{id}`.
- `history.reopen` reads "Open Analysis →" (and its translations) in all locales.

## Impact
Frontend only; uses existing `JobSummary` data. No shared contract change (shared-specs@92a5491bf6c142f2322523c4a24e41a5b04d4946).
