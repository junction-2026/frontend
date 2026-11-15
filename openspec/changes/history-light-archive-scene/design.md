## Decisions
- One SVG, static data: 4 rows x 15 `<rect>` spines (heights from a fixed-seed LCG) plus one board rect per row = 64 shapes; one spine per row is rotated to lean. No gradients, so every colour is auditable as a hex attribute.
- Shelf tones `#EFEBE4`, `#E7E2D9`, `#DDD6CA` are at most 1.4:1 against `#FAFAF9`, under the 1.6:1 decorative ceiling.
- The scrim is fully opaque `var(--surface)` so `--muted #737373` keeps 4.74:1 on it; the shelves show only beside the column.
- The `Purpose` text is not expressible in a delta, so the canonical `Purpose` line is edited directly. Lighting, Dust, Light shift, Parallax and Vignette are REMOVED; a new Motion requirement replaces them.
