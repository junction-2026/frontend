## 1. Selection context
- [x] 1.1 `src/job/focusSelection.tsx` (context, `useFocusPick`, toggle button); raw driver `index` in `readRisk`
- [x] 1.2 Toggles in Verdict, JobView (technique, passage, LLM finding), RiskScore, WikipediaLookup, TermContext; styles in `job.css`

## 2. Result pane
- [x] 2.1 Extract `src/job/ResultDetail.tsx` from `ResultsView`
- [x] 2.2 `AskView`: two-column layout, result pane replaces `FocusPanel` (removed); `ask.css`

## 3. Copy and checks
- [x] 3.1 `ask.focus.select`; remove group headings in en, de, fr, fi, ar, ru
- [x] 3.2 Tests: AskView, focusSelection toggles, ResultsView has none; lint, typecheck, build, validate-openspec
