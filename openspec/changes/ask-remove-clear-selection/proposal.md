## Why
The Ask result pane showed a "Clear selection" button whenever any element was selected, including the default all-selected state. The "Select all" checkbox already clears the selection when checked, so it is the single clear control. Parent: junction-2026/project#102.

## What Changes
- Remove the "Clear selection" button (`.focus-clear`) from the Ask result pane header.
- Remove the now-unused `ask.focus.clear` key from en, de, fr, fi, ru, ar.
- Update AskView tests.

## Impact
Frontend only (`AskView.tsx`, `ask` catalogs, `AskView.test.tsx`). No shared-spec or API change; the Explore page's own "Clear selection" is untouched. Shared spec pin: shared-specs@790c58b570d47ac1b857f333d59a12c4d6c53512 (no change).
