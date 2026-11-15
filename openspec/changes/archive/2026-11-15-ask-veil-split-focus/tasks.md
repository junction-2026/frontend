## 1. API client
- [x] 1.1 `ChatFocusItem` type and `ChatRequest.focus` in `src/api/types.ts`; client test that `focus` is sent unchanged

## 2. Focus items
- [x] 2.1 `src/ask/focusItems.ts`: ordered items, refs per kind, labels (120 / 500 code points); unit tests per kind

## 3. Thread and chat
- [x] 3.1 `useChat`: per-turn focus, request `focus`, storage load/save with and without focus
- [x] 3.2 `Chat.tsx`: chips, whole-analysis hint, narrow toggle, "About:" line
- [x] 3.3 `FocusPanel.tsx` and the split layout in `AskView.tsx` / `ask.css`

## 4. Copy and checks
- [x] 4.1 `ask.focus.*` keys in en, de, fr, fi, ar, ru
- [x] 4.2 AskView tests (selection payloads, limit, retry, restore, layout, rtl, keyboard, literal markup)
- [x] 4.3 lint, typecheck, test, `scripts/validate-openspec.sh`
