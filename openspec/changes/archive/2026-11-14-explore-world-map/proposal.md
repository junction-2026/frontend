## Why

The Explore map is a set of hand-drawn polygons with a fixed Finland tooltip and dead zoom buttons. Parent feature junction-2026/project#33 replaces it with an accurate, interactive world map so country selection, the Country filter and the info panel work on local state fed by a typed mock dataset.

## What Changes

- `WorldMap` renders real country boundaries (Natural Earth 110m TopoJSON bundled with the app) in an Equal Earth projection, with hover tooltip, click selection, zoom, pan and pinch.
- `/explore` gets controlled filter state, a native Country select, a country info panel with "Inspect wire feeds →", a legend None/Low/Medium/High and a subtitle computed from a typed mock coverage dataset.
- `/explore/region` shows the same map, static, with Finland selected.
- Frontend only. No shared contract change (shared specs `ec63dcf9de7f54316d31a827c4428b9d0b98d55a` are unaffected; the map data stays mock and MOCK badges stay).

## Impact

- `src/secondary/` (WorldMap, worldMapData, countryCodes, exploreMockCoverage, CSS, tests), `src/views/ExploreView.tsx`, `src/views/RegionView.tsx`, `src/assets/countries-110m.json`, `docs/mock-areas.md`.
- New dependencies: `d3-geo`, `topojson-client` (+ type packages).
