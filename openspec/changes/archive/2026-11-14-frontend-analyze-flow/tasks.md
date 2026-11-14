## 1. State and stream
- [x] 1.1 `src/analyze/state.ts` reducer (snapshot, plan, analyzer, finalization, scrape, terminal events; seq guard)
- [x] 1.2 `src/analyze/useJobStream.ts` (subscribe, unsubscribe on unmount, polling fallback, 404 on connect)

## 2. Home
- [x] 2.1 Composer (modes, count, submit, Ctrl/Cmd+Enter, URL check, samples)
- [x] 2.2 Advanced options (analyzers list, finalize toggle, request body rules, list failure)
- [x] 2.3 Error alert (errorMessage mapping, per-field, unknown analyzers), mock-marked copy

## 3. Analyzing
- [x] 3.1 Banner, progress bar, stage text, scrape phase text
- [x] 3.2 Ledger rows and status pills, hide toggle
- [x] 3.3 Scrape failure card, terminal states, cancel

## 4. Docs and checks
- [x] 4.1 `src/styles/analyze.css`, `docs/mock-areas.md` rows
- [x] 4.2 Tests; `npm run lint`, `npm test`, `npm run build`, `scripts/validate-openspec.sh`
