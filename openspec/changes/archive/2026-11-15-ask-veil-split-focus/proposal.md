## Why
The Ask VEIL chat only knows a job as a whole. Parent junction-2026/project#93 lets users point VEIL at specific result elements. The shared contract (`analysis-chat-api`, change `chat-focus`) adds an optional `focus` member to ChatRequest; this change is the frontend part.

## What Changes
- `/jobs/:id/ask` becomes a split page: the chat (context bar, thread, composer) and a result panel listing the job's result elements as checkboxes. Two columns from 960px (chat at inline-start, so on the right under `ar`), stacked below with a "Choose result elements" button near the composer.
- Selected elements are sent as `focus` (`{kind, ref, label}`, shared reference grammar) with each question, shown as removable chips above the composer, and stored per user turn (shown as an "About:" line in the bubble, resent by Retry, kept in sessionStorage).
- `ChatRequest` gains `focus?: ChatFocusItem[]`; `postJobChat` sends it unchanged.
- New `ask.focus.*` strings in en, de, fr, fi, ar, ru.

## Impact
Frontend only: `src/views/AskView.tsx`, `src/ask/{Chat.tsx,useChat.ts,FocusPanel.tsx,focusItems.ts,ask.css}`, `src/api/{types.ts,client.test.ts}`, `src/i18n/locales/*/ask.ts`, tests. The result views (`/jobs/:id`, detail) are unchanged; `src/job` helpers are used read-only.
Shared spec pin: shared-specs@36b794f7acd8b31b757f00aeefc57c9f27d7f4d3, change `chat-focus` (analysis-chat-api: ChatRequest object, ChatFocusItem object, Focus kinds, element reference requirements, focus validation, focus applies to the new question).
