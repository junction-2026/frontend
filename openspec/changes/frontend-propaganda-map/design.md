## Decisions
- **Mode switch**: `ExploreView` picks the global map when `id` is undefined, `ExploreJob` otherwise. The old `ExploreEmpty` placeholder is replaced; nothing else in `src/explore/Explore.tsx` changes.
- **Scale** (`src/explore/propagandaMap/scale.ts`): 5 steps of one blue hue. Max ≤ 5: step = count − 1. Max > 5: `floor(5·ln(count)/ln(max))` clamped to 4, so 1 → step 0 and max → step 4. Both are monotonic in count. Legend ranges are derived from the same function, so legend and map cannot disagree.
- **Contrast**: last step ≥ 3:1 against the map background `#F5F9FE`, and first vs last step ≥ 3:1; asserted in a test.
- **WorldMap**: `fillFor(code)` replaces the base fill only (undefined result keeps the default), and with it hover/selected recolouring is replaced by stroke emphasis so the shading stays readable. `focusable` makes live countries `tabIndex=0` `role=button` with an aria-label, Enter/Space call the click handler, focus shows the tooltip (also exposed through `aria-describedby`). Inside a focusable map the SVG is `role=group`, because children of `role=img` are presentational.
- **Panel**: fetches `limit=20`, appends pages on 'Load more' following `next_cursor`. Closing (Escape via WorldMap, or the close button) focuses the country path again.
- **Country name**: `formatCountryName(code, server country || code)`.
- **Country meaning**: copy says "analyses of pages from outlets in <country>"; never propaganda by the country (shared requirement "Map country meaning").
- Known limit: with `focusable` every named country is a tab stop (~175); roving tabindex deferred.
