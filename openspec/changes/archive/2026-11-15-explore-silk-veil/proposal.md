## Why
The CSS-only Explore veil (a glow plus three panels) reads as flat gradient strips. Shared project issue junction-2026/project#97 asks for a real silk-cloth look: a full-viewport shader cloth that billows slowly and is lifted aside by a randomised breeze every 10-20 s, briefly showing pure white behind it.

## What Changes
- `ExploreVeil` renders a `canvas.explore-veil-canvas` driven by plain WebGL1 (one full-screen quad, one fragment shader) in `src/ui/silkVeil/` (shader, renderer, reveal scheduler, capability detection).
- Randomised reveal scheduler (gaps 10-20 s, durations 3-5 s, injectable RNG), device-pixel-ratio cap and render scale, rAF paused while the tab is hidden, full cleanup on unmount.
- Static CSS fabric fallback (`.explore-veil-fallback`) for no WebGL, lost context, reduced motion and low-power devices.
- The `.explore-veil-truth` / `.explore-veil-panel*` elements and the sway/reveal keyframes are removed.
- Mounting in `ExploreView` is unchanged. No shared-spec change (frontend-local UI behaviour), no new npm dependency, no video or image asset.

## Impact
Frontend only, capability `explore-veil`. Pinned shared spec: shared-specs@a973ea23909d6cd5d024cea12cc364fa1516fd61 (not read or changed). Other views, `Explore`, `PropagandaMap` and `ambient.css` are untouched.
