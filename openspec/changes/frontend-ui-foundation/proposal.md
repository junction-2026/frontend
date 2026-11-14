## Why

Parent junction-2026/project#32 ports the Figma export in `UI_DESIGN/` into the React frontend and connects it to the backend. Ten screens are built in parallel, so they need a shared foundation first: self-hosted fonts, design tokens, an app shell with a router, a visible way to mark mock data, a typed API client and an event-stream client.

## What Changes

- Self-host Newsreader and Plus Jakarta Sans (bundled woff2 via `@fontsource` packages); a test forbids Google Fonts URLs.
- Add `src/styles/` (tokens and base/component CSS ported from `UI_DESIGN/css/styles.css`).
- Add a dependency-free History-API router, the app shell (top bar, nav active state, health indicator, language selector) and stub views for the ten routes. **BREAKING (UI):** the "Hello, World!" page is removed; `/?job=<id>` redirects to `/jobs/<id>`.
- Add `MockBadge` and `docs/mock-areas.md`.
- Add `src/api/` (`client.ts`, `types.ts`, `errors.ts`, `events.ts`): typed REST functions that never throw, error copy and a WebSocket client with seq dedupe and bounded reconnect.
- Proxy `/api` with WebSocket support in Vite dev/preview and nginx (`/api/v1/jobs/{id}/events`, 120 s read timeout).

No shared contract change: implemented against shared-specs `ec63dcf9de7f54316d31a827c4428b9d0b98d55a` (`api-conventions`, `analysis-jobs-api`, `analysis-job-events`).

## Capabilities

### New Capabilities
- `ui-design-foundation`: fonts, tokens, routing, shell, nav, MockBadge, mock register, stub views.
- `backend-api-client`: typed REST client, error copy, event stream client.

### Modified Capabilities
- `health-check-ui`: the check now drives a top-bar indicator instead of a page.
- `frontend-runtime`: WebSocket-capable `/api` proxy in Vite and nginx; README.
- `job-result-view`: routing moves from `?job=` to `/jobs/:id`.

## Impact

`src/**`, `vite.config.ts`, `nginx/default.conf.template`, `package.json` (`@fontsource-variable/newsreader`, `@fontsource/plus-jakarta-sans`), `README.md`, `docs/mock-areas.md`, existing App and JobView tests.
