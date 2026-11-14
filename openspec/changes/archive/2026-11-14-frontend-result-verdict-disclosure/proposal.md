## Why

Parent junction-2026/project#38: the Results screen (`/jobs/:id`) shows many things at once. Readers should first see one prominent three-state verdict with its confidence and the backend explanation, and open the detail only on request.

## What Changes

- Results: a large verdict component (`detected` green, `uncertain`/unknown amber, `not_detected` blue) with heading, one line of text, the confidence as a percentage with an explanatory tooltip, and `user_text` (shortened over 280 code points).
- Below it a primary "View detailed analysis" button (inline disclosure, collapsed by default) and a secondary "Ask VEIL" link to `/ask`.
- The detailed region holds everything shown before (excerpt, technique tags, Polarity/Intensity and bias-factor mocks, Copy/Share, links, coverage and analyzer rows) plus the Detail metrics bar and JobView, extracted from `DetailView` into a reusable component.
- The Ask VEIL call-to-action card is removed from Results; a small partial-evidence note appears when an analyzer failed.
- The old banner (red/orange/green) and its two requirements are removed. The rule "confidence is never shown" is replaced for the Results verdict only; the Detail metrics bar still shows none.

No shared contract change; implemented against shared-specs `15b58705d5f6ae93e86134b79e4ae9a1f01ddc9a` (analysis-jobs-api: verdict values, confidence meaning, plain-text `user_text`). History is unchanged (`VERDICT_UI` keeps its values).

## Capabilities

### Modified Capabilities
- `results-history-views`: Verdict card, Finalization states, Technique tags, Job states, Coverage and analyzer outcomes and Mock-only parts of Results rewritten; new requirements for verdict states, confidence, tooltip, explanation, initial actions, progressive disclosure, partial evidence and unchanged History; the two banner requirements removed.

## Impact

`src/job/Verdict.tsx`, new `src/job/DetailedAnalysis.tsx`, `src/views/ResultsView.tsx`, `src/views/DetailView.tsx` (reuses the extracted component), `src/job/results.css`, `src/styles/tokens.css`, `src/views/ResultsView.test.tsx`, `docs/mock-areas.md`.
