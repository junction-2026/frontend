## 1. Placement
- [x] 1.1 Remove `<RiskScore>` from the Results stack in `ResultsView`
- [x] 1.2 Render the overview in `JobView` after the technique-list card and before the LLM group
## 2. Metrics cell
- [x] 2.1 Real Risk cell (percentage + band chip, `—` otherwise) in `DetailedAnalysis`
## 3. Compact overview
- [x] 3.1 Compact `RiskScore.tsx` + `riskScore.css`: no headline, slim meters, 3-item lists with toggle, caveats collapsed
## 4. i18n
- [x] 4.1 `show_all` / `show_less` in six catalogs; remove `metrics.high_risk`
## 5. Tests and checks
- [x] 5.1 Update ResultsView, Detail and RiskScore tests for placement, metrics cell and compact toggles
- [x] 5.2 `npm test`, lint, `tsc -b`, `scripts/validate-openspec.sh`
