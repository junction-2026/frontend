## Why
The Settings & Methodology page is mostly mock, and its only real block (the analyzer list) duplicates what the Analyze screen already fetches for its Advanced options. Parent: junction-2026/project#84.

## What Changes
- The Advanced options panel on Home shows every analyzer of `GET /api/v1/analyzers` (selectable or not) with name, id badge, category, dependencies, an Enabled/Disabled pill and an "<enabled> of <total> analyzers enabled" summary. Non-selectable rows (including the finalizer) are shown checked, disabled and marked "Always on".
- The request body never carries `options` or a non-selectable id.
- Remove the `/settings` route, `SettingsView`, `AnalyzersBlock`, the `settings` catalogs (six locales), the Settings-only CSS, the `shell.account` key and the account/avatar link of the top bar. `/settings` renders Home like any unknown path; `/states` stays routed.

## Impact
Frontend only. No shared contract change: it uses `GET /api/v1/analyzers` and `POST /api/v1/jobs` of `analysis-jobs-api` (shared-specs@00fc92ea48cf68a65b189995ddd4cbffe96a48b5). Does not touch the explore and results catalogs.
