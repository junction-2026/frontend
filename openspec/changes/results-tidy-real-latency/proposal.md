## Why
The detailed region of `/jobs/:id` still shows three Mock-only items (a bias line, a Polarity/Intensity row, a Share button) and the metrics bar shows a hardcoded Mock latency of 412 ms. The API cannot back the first three; the job's own `created_at`/`finished_at` can back Latency. Parent: junction-2026/project#66.

## What Changes
- Remove the "High rhetorical bias factor" line, the Polarity/Intensity signal row and the Share button from the detailed region.
- The metrics bar Latency shows `finished_at − created_at`, formatted like the meta-row duration, or "—"; no `Mock` wrapper. One `duration` helper (`src/job/text.ts`) serves both.
- Remove `results.mock.bias`, `results.bias`, `results.mock.polarity`, `results.polarity`, `results.share` from all six locales (`results.metrics.latency_value` stays for `/states`) and the CSS only they used.
- `docs/mock-areas.md` drops the three `/jobs/:id` rows and the `/jobs/:id/detail` row (nothing in the metrics bar is Mock any more; Risk is already real since `frontend-risk-in-detail`).

## Impact
Frontend only. Latency derives from Job `created_at`/`finished_at` of shared `analysis-jobs-api` (shared-specs@18e157ddd9d020aeb9af984d337bf47f5c970659); no shared contract change.
