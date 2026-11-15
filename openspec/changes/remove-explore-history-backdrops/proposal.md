## Why
Explore and History carry decorative backdrops (a WebGL silk veil and an inline-SVG bookshelf). Parent: junction-2026/project#104 asks for the plain body `var(--bg)` (#fafaf9) on both pages.

## What Changes
- `ExploreView` and `HistoryView` render no backdrop layer; both show the body's solid background.
- Delete `ExploreVeil`, `ArchiveBackground`, their stylesheets and tests, and the `src/ui/silkVeil/` renderer that only the veil used.
- REMOVE every requirement of capabilities `explore-veil` and `archive-background`, and `History backdrop mounting` from `results-history-views`.
- ADD `Explore solid background` and `Backdrop test coverage` (explore-coverage) and `History solid background` (results-history-views).

## Impact
Frontend only. No shared-spec, API or backend change; shared spec pin shared-specs@c9e7f5e559aed64f085d7621a131b8e19bd36b58 (no change). The `+ .view { position: relative; z-index: 1 }` rules go with the stylesheets. The topbar (z-index 40) and hosting badge (z-index 30) are `position: sticky`/`fixed` with their own z-index, and the map tooltip and country panel stack inside `.view`, so no replacement rule is needed. Body text contrast is unchanged: `--ink` on #fafaf9 exceeds 4.5:1.
