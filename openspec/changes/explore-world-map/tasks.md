## 1. Map data and component
- [x] 1.1 Add d3-geo, topojson-client and types; bundle `src/assets/countries-110m.json`
- [x] 1.2 `countryCodes.ts`, `worldMapData.ts` (Equal Earth, countries, selectable list)
- [x] 1.3 Rewrite `WorldMap` (hover, tooltip, selection, zoom/pan/pinch/wheel, reduced motion)
- [x] 1.4 CSS: container, palette swatches, tooltip, panel, responsive

## 2. Screens
- [x] 2.1 `exploreMockCoverage.ts` dataset and summary
- [x] 2.2 `ExploreView`: controlled topic/country, Country select, info panel, legend, subtitle
- [x] 2.3 `RegionView`: static `WorldMap` with Finland selected
- [x] 2.4 `docs/mock-areas.md` rows

## 3. Tests and validation
- [x] 3.1 Map, selection, select sync, zoom bounds, wheel/drag, empty dataset, static map tests; update the navigation test
- [x] 3.2 `npm run lint`, `npm test`, `npm run build`, `scripts/validate-openspec.sh`
