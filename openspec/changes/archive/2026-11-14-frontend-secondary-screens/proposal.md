## Why

Parent junction-2026/project#32 ports the Figma export into the React frontend. The shell, router and `Mock` badge exist (frontend-ui-foundation); the Explore, Region, Ask, States and Settings routes are still stubs. Only the Settings analyzers list has a backend (`GET /api/v1/analyzers`); everything else must be visibly marked as mock. Once these screens are ported the design export in `UI_DESIGN/` is no longer needed.

## What Changes

- Add the Explore (`/explore`), Region (`/explore/region`), Ask (`/ask`), States (`/states`) and Settings (`/settings`) views, rebuilt as React components with the mock's layout; styles in `src/secondary/secondary.css`.
- Wrap every hardcoded number, chart, map, sample post, canned answer and non-functional control in `Mock`.
- Settings "Active AI analyzers & ensembles" lists `GET /api/v1/analyzers` (real data, not marked) with loading, error and empty states.
- Append the new rows to `docs/mock-areas.md`.
- **BREAKING (repo):** delete `UI_DESIGN/` and its `.dockerignore` line; remove the `design-reference` capability.

No shared contract change: implemented against shared-specs `ec63dcf9de7f54316d31a827c4428b9d0b98d55a` (`analysis-jobs-api`, "List analyzers").

## Capabilities

### New Capabilities
- `secondary-screens`: behaviour of the five screens and which parts are mock.

### Removed Capabilities
- `design-reference`: `UI_DESIGN/` is deleted, so its requirements go with it.

## Impact

`src/views/{Explore,Region,Ask,States,Settings}View.tsx`, `src/secondary/**`, `src/router.test.tsx` (headings), `docs/mock-areas.md`, `.dockerignore`, `UI_DESIGN/**`.
