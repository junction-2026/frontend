## Why

In the Ask view every result element starts unselected, so a user who wants to ask about the whole result with focus must toggle each section by hand, and clearing means a different button. A "Select all" checkbox next to the "Analysis result" heading, with everything selected by default, makes the common case free and gives one control to flip between all and none (project#99).

## What Changes

- A native "Select all" checkbox (checked, indeterminate or unchecked) in the result pane header, after the `<h2>`, at the inline end.
- Activating it clears the selection when checked, otherwise selects the first min(n, 20) elements in panel order.
- When a completed job's focusable items first appear in a `JobChat`, the selection defaults once to the first min(n, 20) items.
- New `ask.focus.select_all` string in en, de, fr, fi, ru, ar.
- Existing tests that assumed an empty initial selection are updated.

No shared contract change: the focus cap of 20 stays as in the shared `ChatRequest focus validation`.

## Impact

Frontend only: `src/views/AskView.tsx`, `src/ask/ask.css`, `src/i18n/locales/*/ask.ts`, `src/views/AskView.test.tsx`. Capability `ask-chat` (shared spec `a973ea23909d6cd5d024cea12cc364fa1516fd61`, no shared change).
