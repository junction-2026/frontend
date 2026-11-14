## Why

Parent junction-2026/project#35: the Results screen shows the verdict as a small pill and uses the AI's `user_text` as the headline. The verdict should be the first, most prominent thing a reader sees, and the explanatory text belongs in the detailed analysis.

## What Changes

- Results: for a completed finalization with a result, a large solid-colour verdict banner (red `detected`, orange `uncertain`/unknown, green `not_detected`) carries the verdict label as the level-2 heading. `user_text` is no longer shown on Results.
- Non-verdict states keep their pill and message headline, unchanged and neutral.
- Detail: a "Final assessment" section shows the verdict label and `user_text` as plain text.

No shared contract change; implemented against shared-specs `3e3570c169302e94c2154927ec4d4b81aa6009cf`. History tags (`VERDICT_UI` tones) are unchanged.

## Capabilities

### Modified Capabilities
- `results-history-views`: Verdict card (rewritten), Finalization states and Job states (neutral card clarified), new Verdict banner colour, Verdict banner accessibility and Detail verdict text requirements.

## Impact

`src/job/Verdict.tsx`, `src/job/results.css`, `src/views/DetailView.tsx`, `src/views/ResultsView.test.tsx`, new `src/views/DetailView.test.tsx`.
