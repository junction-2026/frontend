## Library decision

`react-simple-maps` 5.0.x does list React 19 in `peerDependencies`, so it would install without `--legacy-peer-deps`. We still use `d3-geo` (`geoEqualEarth`) + `topojson-client` rendered in our own SVG: the required behaviour (clamped pan, 1.5x button zoom with a 250ms transition, pinch, non-passive wheel, non-scaling strokes, per-path fill/stroke transitions, tooltip clamping) is custom either way, and `react-simple-maps` would add `d3-zoom`/`d3-selection` and a second zoom model next to ours for no gain. `react-simple-maps` bundles the same d3-geo and topojson-client, so the dependency set is a strict subset. No overrides or legacy peer flags are used.

## Geography

`src/assets/countries-110m.json` is `world-atlas@2.0.2` `countries-110m.json` (Natural Earth, public domain), 108 KB, imported by Vite; nothing is fetched at runtime. `countryCodes.ts` maps the ISO 3166-1 numeric feature id to alpha-2 (174 entries). Features without an id (N. Cyprus, Somaliland, Kosovo) render in the no-coverage colour and are inert, so the Country select lists the 174 coded countries.

## Rendering

`worldMapData.ts` fits `geoEqualEarth` to a 960-wide viewBox (`fitWidth` on the sphere), so the map fills the container and the SVG scales by `viewBox`; height follows the aspect ratio. View state is `{k, x, y}` applied as one CSS transform on a `<g>` (transition 250ms, off while dragging and under `prefers-reduced-motion`). Panning is clamped so the scaled map always covers the viewport. Fill and stroke are set per path from state (selected > hover > coverage level), so they are testable in jsdom; transitions live in CSS. Strokes use `vector-effect: non-scaling-stroke`.

Zoom buttons moved into the map stage (top-right overlay) because `WorldMap` owns the view state; the labels (`Zoom in`, `Zoom out`, `Reset`) are unchanged. They are absent when `interactive` is false.

Escape clears the selection through a window listener (paths are not tab stops) that ignores events from inputs, selects and textareas. A pointer capture is taken only after a drag passes 3px so a plain click still reaches the country path.

## Data

`exploreMockCoverage.ts` is the typed mock dataset (alpha-2 keys, explicit articles/publishers/level, Finland 12/4/high) and `coverageSummary` derives the card subtitle. `ExploreView` is a thin default export around `Explore({ coverage })` so tests can pass an empty dataset.
