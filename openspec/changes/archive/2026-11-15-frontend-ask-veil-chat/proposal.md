## Why
The Ask VEIL screen is a mock. Shared `analysis-chat-api` (junction-2026/shared-specs@5f4e9e4789a043c2ee8620f54fc3da58cea1cb86, change `analysis-chat-api`) now defines `POST /api/v1/jobs/{id}/chat`, so the screen can hold a real conversation about one finished analysis (junction-2026/project#57, frontend#106).

## What Changes
- `/jobs/:id/ask` renders a real chat for that job; plain `/ask` becomes a "Choose an analysis to ask about" state linking to `/history`.
- New `src/ask/*` (thread, composer, error and state handling, session-scoped history) and `postJobChat` in the API client; new error codes in `errors.ts`.
- The Ask VEIL links on Results and States point to `/jobs/{id}/ask`.
- nginx gets a chat location with 120 s timeouts.
- `ask` catalogs (en, de, fr, fi, ar, ru) lose the canned mock strings and gain the chat copy; `docs/mock-areas.md` loses the `/ask` row.
- No shared contract change: the screen follows `analysis-chat-api` as published.

## Impact
Specs: new `ask-chat`; modified `secondary-screens`, `results-history-views`, `frontend-runtime`, `ui-design-foundation`, `backend-api-client`, `i18n`. Parallel with `frontend-term-cards` (#49): no edits to `results.ts`, `analysis.ts`, `techniques.ts`, `common.ts` or the i18n runtime; keys only change inside `ask.*`.
