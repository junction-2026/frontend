# Mock areas

Every UI area that is **not** connected to the backend is wrapped in `<Mock>` (`src/ui/MockBadge.tsx`): a dashed
outline in the `--mock` colour, a small uppercase `MOCK` badge and the tooltip "Mock data – not connected to the
backend". Real data is never wrapped in it. Each screen task appends its rows here.

| Route | Element | Why it is mock |
| --- | --- | --- |
| all (top bar) | Language selector "English ▾" | No language setting or i18n exists in the backend or the app |
| `/` (Home) | Chip "Auto-detect (EN, FR, AR, DE, FI)" | The backend has no language detection setting |
| `/` (Home) | Feature cards "Unbiased Dissection", "Provenance & Signals", "Private by Architecture" | Marketing copy, not data |
| `/jobs/:id/live` | "Cluster: eu-west-alpha-2" | The backend does not report a cluster |
| `/jobs/:id/live` | "Zero-retention ephemeral pipeline" | A retention claim the API does not state |
| `/jobs/:id/live` | Ledger caption "Synchronous consensus pool" | No backend counterpart |
