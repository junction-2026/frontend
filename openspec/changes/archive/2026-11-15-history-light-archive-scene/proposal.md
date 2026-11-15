## Why
Parent junction-2026/project#101: the dark, detailed, animated archive scene behind History clashes with the neutral site palette (`--bg #fafaf9`, `--surface #fff`). It is replaced by a light, low-detail, static library-shelf backdrop.

## What Changes
- `ArchiveBackground` renders only `.archive-room` (one inline-SVG bookshelf silhouette: 4 boards with upright book spines of varying height and a leaning book) and `.archive-scrim` (opaque `var(--surface)` reading column).
- Light shafts, dust motes, vignette, far shelf layer, parallax, blur and the scroll/folder/manuscript/roll/stack shapes are removed. All keyframes, will-change and filters are removed; the scene is static.
- The `prefers-reduced-motion` block and the hidden-tab `archive-paused` hook stay as guards.
- Colours: `var(--bg)`, `var(--surface)`, `var(--line)`, `var(--line-strong)` or light warm-neutral hex (every channel at least 0xC8, R >= G >= B, R - B <= 0x18, contrast at most 1.6:1 against `#FAFAF9`).

## Impact
Frontend only, no shared contract change (shared-specs@a973ea23909d6cd5d024cea12cc364fa1516fd61 untouched).
Files: `src/ui/ArchiveBackground.tsx`, `src/styles/archive-bg.css`, `src/ui/ArchiveBackground.test.tsx`, `src/styles/archive-bg.test.ts`, the `Purpose` line of `openspec/specs/archive-background/spec.md`. `HistoryView.tsx`, its tests, other stylesheets, copy, i18n and `package.json` do not change.
