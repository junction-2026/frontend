## Why
Parent junction-2026/project#98: the pastel archived-documents backdrop behind History reads as flat decoration. A dark, warm, animated archive-library scene gives the page atmosphere while the light-theme History UI stays untouched (human-confirmed option A).

## What Changes
- `ArchiveBackground` draws a dark archive library in code: two inline-SVG shelf layers (floor-to-ceiling rows of scrolls, parchment rolls, leather folders, manuscripts and document stacks), golden light shafts, dust motes, a vignette and a reading scrim.
- Motion is transform/opacity only: dust drift, slow light breathing, very slow shelf parallax. It stops under `prefers-reduced-motion` and pauses while the tab is hidden (`archive-paused`).
- The reading scrim is a near-opaque aged-paper column (`#FFFDF8` at alpha 0.99). The requirement text gave 0.88 to 0.94 only as an example; with that alpha `--muted` (lede, day labels) reaches just 3.2 to 4.2:1, so 4.5:1 forced a near-white panel (human decision: option A).
- Replaces the pastel palette, white veil, 5 to 8 documents and 30s to 60s drift requirements of `archive-background`.

## Impact
Frontend only, no shared contract change (shared-specs@a973ea23909d6cd5d024cea12cc364fa1516fd61 untouched).
Files: `src/ui/ArchiveBackground.tsx`, `src/styles/archive-bg.css` and their tests, the `archive backdrop` block of `src/views/HistoryView.test.tsx`. `HistoryView.tsx`, other stylesheets, copy, i18n catalogs and `package.json` do not change.
