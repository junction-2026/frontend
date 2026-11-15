## Why
Parent project#105 reverts the minimalist Try row of project#96 (frontend 83231bd, archived change `home-try-minimal-links`): the corpus chips come back as tinted pills drawn on load, with lighter tints and a much shorter explainer.

## What Changes
- Restore the pre-#96 Try row: 5 corpus chips drawn automatically once the corpus is active, tinted per expectation, plus a pill Shuffle; the four fixed samples show only in fallback mode.
- New `--try-*` color tokens (lighter than the matching `--verdict-*` tokens, which stay unchanged).
- Explainer shows only while the corpus is active, with a shorter `home.try.info` in all six locales (no color note, no parenthetical, not the #96 copy).
- Remove the requirements "Try row link style", "Try-out corpus links" and "Try-out explainer always shown".

## Impact
Frontend only (`HomeView.tsx`, `analyze.css`, `tokens.css`, home catalogs `try.info`, tests). No shared-spec change (shared change: none). Modifies capability `analyze-flow-ui`; `src/home/tryCorpus.ts` and the corpus are unchanged.
