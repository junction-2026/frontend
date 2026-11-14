## Why
The Analyze homepage is a flat off-white surface. Shared project issue junction-2026/project#65 asks for a calm, animated pastel ambient background that adds depth without touching the real UI.

## What Changes
- New decorative `AmbientBackground` layer (6 blurred pastel blobs, plain CSS keyframes) mounted only by `HomeView`, as a sibling before `.view`.
- New `src/styles/ambient.css`; the `body` background stays solid `var(--bg)`.
- Blob drift is disabled under `prefers-reduced-motion: reduce`.
- No shared-spec change (local UI behaviour), no new dependency.

## Impact
Frontend only. Pinned shared spec: shared-specs@3949bec3d32a399427d239e3147239fa1e716cfe (not read or changed). Other routes and the existing ui-design-foundation 'Base surface' requirement are unchanged.
