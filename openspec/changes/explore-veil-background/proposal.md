## Why
The Explore page is a flat surface. Shared project issue junction-2026/project#85 asks for a subtle animated cloth veil behind it that periodically parts to reveal a soft "truth" glow.

## What Changes
- New decorative `ExploreVeil` layer (a glow and three translucent cloth panels, CSS keyframes only) mounted by `ExploreView` as a sibling before `.view`, in both modes.
- New `src/styles/explore-veil.css`; the `body` background stays solid `var(--bg)`.
- All veil animation is disabled under `prefers-reduced-motion: reduce`.
- No shared-spec change (local UI behaviour), no new dependency.

## Impact
Frontend only. Pinned shared spec: shared-specs@00fc92ea48cf68a65b189995ddd4cbffe96a48b5 (not read or changed). Explore, PropagandaMap, ambient.css and AmbientBackground are untouched.
