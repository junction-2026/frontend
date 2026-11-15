## 1. Router
- [x] 1.1 Remove the `detail` RouteName, ROUTES entry, App VIEWS entry, `DetailView.tsx` and its test
- [x] 1.2 Extend `redirectLegacy` with `/jobs/<id>/detail[/]` -> `/jobs/<id>` (query kept) and run it on `popstate`
## 2. Results screen and catalogs
- [x] 2.1 Remove the "Open detailed analysis page" link from `.card.detailed-summary`
- [x] 2.2 Remove `results.open_detail` and `results.detail.{back,label,title,lede,final}` from the six locales
- [x] 2.3 Remove `.detail-top`, `.detail-id`, `.final-assessment` CSS
## 3. Tests and checks
- [x] 3.1 Router redirect tests (init, navigate, popstate), no `detail` route; ResultsView link assertions; move Detail.test.tsx cases onto DetailedAnalysis; drop the detail-page localization case
- [x] 3.2 `npm run lint`, `npm run build`, `npm test`, `scripts/validate-openspec.sh`
