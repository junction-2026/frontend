# Mock areas

Every UI area that is **not** connected to the backend is wrapped in `<Mock>` (`src/ui/MockBadge.tsx`): a dashed
outline in the `--mock` colour, a small uppercase `MOCK` badge and the tooltip "Mock data – not connected to the
backend". Real data is never wrapped in it. Each screen task appends its rows here.

| Route | Element | Why it is mock |
| --- | --- | --- |
| `/jobs/:id/live` | Ledger caption "Synchronous consensus pool" | No backend counterpart |
| /jobs/:id (detailed analysis section) | "Polarity / Intensity" signal row | The analysis API has no polarity or intensity |
| /jobs/:id (detailed analysis section) | "High rhetorical bias factor" | No such rating exists in the final assessment |
| /jobs/:id (detailed analysis section) | Share button | No share feature exists |
| /jobs/:id/detail | "Risk" tag and "Latency" value in the metrics bar | The API has no risk rating or per-job latency |
| /history | Search box (disabled) | `GET /api/v1/jobs` has no text search |
| /history | "Export Ledger" button (disabled) | No export endpoint exists |
| /history | "Workspace session local" and "Synchronized" | There is no workspace session or sync state; jobs are stored by the backend |
| /explore/region | Selected-region map (Finland), statistics and region details (articles, wire items) | No region or publisher data in the backend |
| /ask | Context bar, thread with canned answers, suggestions, composer ("No backend for Ask VEIL") | No Ask endpoint; sending only appends a local bubble and sends no request |
| /states | Whole page ("Example states") and the disabled "Retry Wire Retrieval" button | Static showcase; real states render on results, analyzing and history |
| /settings | Tabs (Interface & Language, Analyzers & Ensembles, Accessibility, Epistemic Framework, Data Retention) | No user settings or i18n in the backend; tabs are non-functional |
