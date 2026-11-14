## 1. Catalogs
- [x] 1.1 `src/i18n/locales/{en,fr,ar,de,fi}/{analysis,results}.ts`
- [x] 1.2 Existing catalog consistency test covers the new namespaces (same keys and placeholders as en)

## 2. Screens
- [x] 2.1 `AnalyzingView` and `src/analyze/state.ts` labels on the `analysis` namespace; cancel error translated at render
- [x] 2.2 `ResultsView`, `Verdict`, `Coverage`, `DetailedAnalysis`, `JobView`, `WithJob` on the `results` namespace
- [x] 2.3 `DetailView` and `StatesView` on the `results` namespace
- [x] 2.4 Enum mapping with raw fallback (`src/job/text.ts`)
- [x] 2.5 Numbers, percentages, durations and plural counts through `useFormat` / plural keys

## 3. RTL
- [x] 3.1 `job.css`, `results.css` logical properties

## 4. Tests
- [x] 4.1 Existing Analyzing/Results/Detail tests pass in en
- [x] 4.2 One test per screen under `de` (and Arabic for States/Results): translated heading, API content unchanged
- [x] 4.3 Percent formatted per locale (fr non-breaking space); language switch re-renders; unknown enum renders raw; stylesheet has no physical left/right
