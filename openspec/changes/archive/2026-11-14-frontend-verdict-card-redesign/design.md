## Decisions
- Derivations return plain data (counts, the top `Detection`); `cardsOf` in `verdictCards.ts` turns them into labelled cards so the component only renders.
- Span validity reuses `validSpans` (job-result-view) against `input.content`; evidence ranges merge when `start < previous end` (adjacent ranges stay separate).
- The pill for an orchestrator `uncertain` result reuses `results.insufficient`, so the "Insufficient evidence" signal is the pill text.
- When the summary is the whole `user_text`, no disclosure is rendered and the #45 localization note is shown under the summary so a machine translation is never unlabelled.
- Actions are restyled through `.results-actions` selectors only; `btn-primary`/`btn-secondary` stay unchanged for other screens.
- Contrast: detected card text is #437562 (the proposed #4D806B reached only 4.14:1); every other proposed value passes 4.5:1.
