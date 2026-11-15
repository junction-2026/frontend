## Why
The "+ New Analysis" top-bar button duplicates the brand link and the Analyze nav item, which both go to `/`.

## What Changes
- Remove the button from `src/ui/Shell.tsx` and the `shell.new_analysis` key from all six locales.
- Update `src/router.test.tsx` to assert its absence.

## Impact
Frontend only; no shared contract change. `.btn-primary` CSS stays (used by other views); `.topbar-actions` is a gap-based flex row, so no layout change is needed.
