## Why

Parent junction-2026/project#32 ports the Figma export into the React frontend. The Results, Detailed analysis and History screens are still stubs; this change connects them to `GET /api/v1/jobs/{id}` and `GET /api/v1/jobs` and folds the existing job result view into the Detail screen.

## What Changes

- Results (`/jobs/:id`): verdict, `user_text`, technique tags, finalization states, job states, coverage and per-analyzer outcomes, polling every 2000 ms while the job is not done.
- Detail (`/jobs/:id/detail`): metrics bar plus the existing job result view (highlights, technique list, why, LLM group) in the new styling. **BREAKING (UI):** the technique entries show `Detection.name` as ID badge; no score or confidence is shown anywhere.
- History (`/history`): `listJobs` with cursor pagination, status filter chips, day groups, per-item excerpt via `getJob` (at most 4 concurrent requests) and reopen links.
- Mock-only parts are wrapped in `Mock` and listed in `docs/mock-areas.md`.

No shared contract change: implemented against shared-specs `ec63dcf9de7f54316d31a827c4428b9d0b98d55a` (`analysis-jobs-api`, `api-conventions`).

## Capabilities

### New Capabilities
- `results-history-views`: Results, Detail metrics and History screens (frontend UI behaviour).

### Modified Capabilities
- `job-result-view`: routing only; the view is shown inside Detail at `/jobs/:id/detail`.

## Impact

`src/views/{Results,Detail,History}View.tsx`, `src/job/**`, `src/history/**`, their tests and CSS, `docs/mock-areas.md`.
