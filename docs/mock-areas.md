# Mock areas

Every UI area that is **not** connected to the backend is wrapped in `<Mock>` (`src/ui/MockBadge.tsx`): a dashed
outline in the `--mock` colour, a small uppercase `MOCK` badge and the tooltip "Mock data – not connected to the
backend". Real data is never wrapped in it. Each screen task appends its rows here.

| Route | Element | Why it is mock |
| --- | --- | --- |
| all (top bar) | Language selector "English ▾" | No language setting or i18n exists in the backend or the app |
| /jobs/:id | "Polarity / Intensity" signal row | The analysis API has no polarity or intensity |
| /jobs/:id | "High rhetorical bias factor" | No such rating exists in the final assessment |
| /jobs/:id | Share button | No share feature exists |
| /jobs/:id | Ask VEIL call to action | The Ask VEIL conversation is not connected to the backend |
| /jobs/:id/detail | "Risk" tag and "Latency" value in the metrics bar | The API has no risk rating or per-job latency |
| /history | Search box (disabled) | `GET /api/v1/jobs` has no text search |
| /history | "Export Ledger" button (disabled) | No export endpoint exists |
| /history | "Workspace session local" and "Synchronized" | There is no workspace session or sync state; jobs are stored by the backend |
