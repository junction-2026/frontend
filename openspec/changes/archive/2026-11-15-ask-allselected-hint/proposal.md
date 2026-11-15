## Why
Parent project#107: with the default selection (every element, up to 20) the focus bar shows up to 20 chips, which says nothing the Select all checkbox does not. A selection of every element is, in effect, a question about the whole analysis.

## What Changes
- When the selection is empty, or contains every `focusItemsOf` item, the focus bar shows the existing `ask.focus.hint` and no chip list. Otherwise it shows chips as before.
- With more than 20 items the selected count never equals the total, so any non-empty selection still shows chips.
- Selection model, default selection, Select all, limit note, "Choose result elements" button and the request `focus` payload are unchanged (an all-selected state still sends every item).

## Impact
Frontend only (`src/ask/Chat.tsx`, `src/views/AskView.tsx`, tests). Shared change: none; `analysis-chat-api` is untouched. No i18n key is added or changed. Modifies capability `ask-chat`.
