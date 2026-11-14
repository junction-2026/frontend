## 1. API client
- [x] 1.1 `src/api/mapTypes.ts` tolerant types and readers; `getMapCountries`, `listCountryAnalyses` appended to `src/api/client.ts`; client tests
## 2. WorldMap
- [x] 2.1 Optional `fillFor`, `renderTooltip`, `focusable` props; tests for new props and unchanged defaults
## 3. Propaganda map
- [x] 3.1 `scale.ts` + monotonicity and contrast tests
- [x] 3.2 Model hooks, tooltip, panel, `PropagandaMap`; `ExploreView` mode switch
- [x] 3.3 Tests: shading/legend/tooltip/keyboard/panel paging/empty/error; `/explore?job=` regression
## 4. i18n
- [x] 4.1 `explore` keys in en, fr, ar, de, fi, ru
## 5. Checks
- [x] 5.1 `npm test`, `npm run lint`, `npx tsc -b`, `scripts/validate-openspec.sh`
