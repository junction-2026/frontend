## 1. Extract and reuse
- [x] 1.1 `src/job/DetailedAnalysis.tsx` (metrics bar + JobView); `DetailView` reuses it

## 2. Results screen
- [x] 2.1 Verdict component, confidence line and tooltip, explanation, partial-evidence note (`Verdict.tsx`)
- [x] 2.2 Disclosure button, Ask VEIL link and detailed region (`ResultsView.tsx`)
- [x] 2.3 Tokens and CSS (`tokens.css`, `results.css`); remove banner and Ask CTA styles
- [x] 2.4 `docs/mock-areas.md`

## 3. Tests and validation
- [x] 3.1 Update and extend `ResultsView.test.tsx`
- [x] 3.2 typecheck, lint, vitest, build, `scripts/validate-openspec.sh`
