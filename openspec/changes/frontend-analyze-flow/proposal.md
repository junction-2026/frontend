## Why

Parent junction-2026/project#32 ports the Figma export into the React frontend and connects it to the backend. The `home` and `analyzing` mock views are the entry point: a composer that creates analysis jobs and a live view that follows a job over its event stream. The design foundation (junction-2026/frontend#14) already provides the router, `Mock` badge, REST client and event client; this change builds the two screens on them.

## What Changes

- `HomeView`: Text / Social Link composer that calls `POST /api/v1/jobs` (`{input:{content}}` or `{scrape:{url}}`), client-side URL check, advanced options (analyzer selection from `GET /api/v1/analyzers`, final assessment toggle), error alert with per-field messages, sample buttons, mock-only copy wrapped in `Mock`.
- `AnalyzingView` (`/jobs/:id/live`): state built from `job.snapshot` and later events (`src/analyze/`), progress bar and ledger from `analysis.planned`, `Progress` and `Activity`, scrape progress and failure card, cancel, terminal handling (navigate to results on `job.completed`), polling fallback when the WebSocket gives up.
- Appends its mock rows to `docs/mock-areas.md`.

No shared contract change: implemented against shared-specs `ec63dcf9de7f54316d31a827c4428b9d0b98d55a` (`analysis-jobs-api`: Create job, Create job validation, Analyzer selection, ScrapeRequest, Cancel job; `analysis-job-events`: snapshot, plan, Activity, Progress, scrape events).

## Capabilities

### New Capabilities
- `analyze-flow-ui`: the composer on Home and the live analyzing view.

### Modified Capabilities
None.

## Impact

`src/views/HomeView.tsx`, `src/views/AnalyzingView.tsx`, `src/analyze/**`, `src/styles/analyze.css`, `docs/mock-areas.md`.
