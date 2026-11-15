## Context
`.archive-bg` sits fixed behind `.view`; the light UI is unchanged, so the dark scene needs a reading panel.

## Decisions
- Shelves are generated once at module load from a seeded LCG into two SVGs (far: 5 rows, dark, blurred 3px; near: 4 rows), so the DOM is deterministic and the file stays small.
- Parallax moves each SVG with `translate3d` by `--drift` (near 2.5vw, far 1.5vw, near halved under 640px); each layer is `100% + 2 * --drift` wide, anchored at `inset-inline-start: 0`, and `--flip` mirrors the direction in RTL.
- Shafts get their static tilt from the individual `rotate` property so the keyframes animate only `transform` and `opacity`.
- Dust positions are inline custom properties; size, duration and phase are `nth-child` rules, keeping all timing in the stylesheet.
- Pause: React state mirrors `document.visibilityState` via a `visibilitychange` listener (no timers); CSS applies `animation-play-state: paused`.
- Scrim contrast: `--ink` and `--ink-2` pass at any alpha, `--muted` (#737373) needs the scrim above about 0.98 alpha of a near-white paper over the darkest scene colour, hence `#FFFDF8FC`.
