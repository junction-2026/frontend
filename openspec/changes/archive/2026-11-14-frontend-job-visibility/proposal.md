## Why
Shared change `job-visibility` (shared-specs@9a26edb52efa7e1ee9a46eea7721be73f67b50b7, parent junction-2026/project#53, child #86) lets a job be created non-public: it is left out of `GET /api/v1/jobs` but stays reachable by URL. The Home composer needs a switch to set it.

## What Changes
- `CreateJobBody` (input and scrape variants) and `Job` gain optional `public?: boolean`; an absent value reads as true.
- The Home composer gets a labelled switch, on by default, with a hint that non-public jobs are not shown in History but anyone with the link can open them. Off sends `"public": false`; on omits the member.
- New catalog namespace `compose` (`compose.visibility.label`, `compose.visibility.hint`) in en, fr, ar, de, fi.
- History is unchanged: it renders what the backend lists.

## Impact
Specs: backend-api-client, analyze-flow-ui, i18n. Files: src/api/types.ts, src/views/HomeView.tsx, src/styles/analyze.css, src/i18n/locales/*/compose.ts, tests. No shared contract change.
