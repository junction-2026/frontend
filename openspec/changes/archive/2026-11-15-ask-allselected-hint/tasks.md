## 1. Implementation
- [x] 1.1 `Chat` takes `total` (the `focusItemsOf` count) and renders the hint instead of chips when the selection is empty or equals `total`
- [x] 1.2 `JobChat` passes `items.length`

## 2. Tests
- [x] 2.1 AskView tests: default hint, deselect one, reselect, one-by-one selection, empty, more than 20 items, hint iff Select all checked
- [x] 2.2 Adjust tests that expected 15 chips after the default selection

## 3. Validation
- [x] 3.1 `scripts/validate-openspec.sh`, `npm test`, `npm run lint`, `npm run build`
