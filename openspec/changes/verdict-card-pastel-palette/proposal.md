## Why
The verdict card shows `detected` in green and `not_detected` in blue, which reads backwards (junction-2026/project#62, child #93). It becomes a pastel red / green / amber palette with a thicker border, an ExtraBold headline and a pulsing status dot.

## What Changes
- Verdict tokens: detected red (#FDE8E8 / #F5B8B8 / #8B2525), not_detected green (#E5F7EC / #A8E4BF / #246B45), uncertain and unknown amber (#FFF1DC / #F2D49B / #8A5A18). Pill background is the state's bg with a 1px border in the border colour.
- `--fw-extrabold: 800`, used only by the verdict headline; it is the one exception to #61's 600 weight ceiling (modifies Type scale; Neutral surface tokens no longer says verdict tokens are unchanged). The card's other weights stay at or below 600, as #61 set them.
- Card border 1px to 2px; pill gets a 1px border; the pill dot glows and pulses (static under `prefers-reduced-motion`).
- No shared contract change. Out of scope: OG images, History tags, Detail assessment, non-verdict state cards, copy, layout.
- #61 (`frontend-visual-fidelity`) has landed; this change is rebased onto it, keeps its font-family and weight edits and only adds the 800 exception for `.verdict h2`. `src/fonts.test.ts` allows `--fw-extrabold` only there.

## Impact
Specs: ui-design-foundation, results-history-views. Files: `src/styles/tokens.css`, `src/job/results.css`, `src/styles/verdictTokens.test.ts`, `src/views/ResultsView.test.tsx`, `src/fonts.test.ts`.
