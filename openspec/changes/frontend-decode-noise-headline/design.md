## Decisions
- Pure CSS: `::before`/`::after` re-render `data-text` as clipped, offset shards; a scanline + fade `mask-image` on the text makes letters partly vanish; `scaleY` makes them tall.
- Three `noise-*` keyframes on one 8s `steps()` cycle; all motion is in the first 16%, so it is calm otherwise.
- Overall opacity 0.1 keeps foreground `--ink` contrast; the layer is fixed and out of flow, so no layout shift or overflow.
- Mounted before `AmbientBackground` so `.ambient-bg` still directly precedes `.view`.
