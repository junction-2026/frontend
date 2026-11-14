## Why
The verdict card shows `detected` in green and `not_detected` in blue, which reads backwards (junction-2026/project#62, child #93). It becomes a pastel red / green / amber palette with a thicker border, an ExtraBold headline and a pulsing status dot.

## What Changes
- Verdict tokens: detected red (#FDE8E8 / #F5B8B8 / #8B2525), not_detected green (#E5F7EC / #A8E4BF / #246B45), uncertain and unknown amber (#FFF1DC / #F2D49B / #8A5A18). Pill background is the state's bg with a 1px border in the border colour.
- `--fw-extrabold: 800`, used only by the verdict headline; the card's other weights stay at or below 600 (pill and confidence button drop from 700 to 600, as #61 does).
- Card border 1px to 2px; pill gets a 1px border; the pill dot glows and pulses (static under `prefers-reduced-motion`).
- No shared contract change. Out of scope: OG images, History tags, Detail assessment, non-verdict state cards, copy, layout.
- Overlap with #61 (`frontend-visual-fidelity`): this change keeps #61's font-family and weight edits when rebasing and only adds the 800 exception for `.verdict h2`.

## Impact
Specs: ui-design-foundation, results-history-views. Files: `src/styles/tokens.css`, `src/job/results.css`, `src/styles/verdictTokens.test.ts`, `src/views/ResultsView.test.tsx`.
