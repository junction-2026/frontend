## Why
The Home "Try:" row grew into tinted pills with an auto-drawn corpus and a long explainer. Parent project#96 restores a minimalist row: underlined inline links, the four fixed samples first, Shuffle for corpus statements, and a short always-on explainer.

## What Changes
- Try examples render as underlined inline text separated by `·`; pill/chip styling and verdict tints are removed.
- The four fixed samples show on load and stay after the corpus loads; the corpus is no longer auto-drawn.
- Shuffle (only with a valid corpus) replaces the row with 5 drawn corpus statements; each press redraws.
- `home.try.info` is always shown with new copy in all six locales.

## Impact
Frontend only (`HomeView.tsx`, `analyze.css`, home catalogs, tests). No shared-spec change (shared_change_id none). Modifies capability `analyze-flow-ui`.
