## Why
The Analyzing, Results, Detail and States screens still show fixed English text although the app now has a working language selector and an i18n layer (junction-2026/project#39, child #42, stacked on #41).

## What Changes
- Every user-facing string of `AnalyzingView`, `ResultsView`, `DetailView`, `StatesView`, `src/job/*` (JobView, Verdict, Coverage, DetailedAnalysis, WithJob) and the ledger labels in `src/analyze/state.ts` moves into the catalog namespaces `analysis` and `results` for en, fr, ar, de, fi.
- Enum values (job status, analyzer status, availability, verdict, finalization skip reason) map to catalog keys; a value the catalog does not know renders raw.
- API-provided strings (input text, plain-language name/definition/why, explanations, assessment text, API error `message`, analyzer ids and names, labels) are never passed through `t()`.
- Counts, percentages and durations use the foundation number formatter in the active locale; plural counts use `_one`/`_other` (and Arabic) form keys.
- `job.css` and `results.css` use logical properties, so highlights and the "why" region work in `rtl`.
- No shared contract change: everything is local to the frontend.
