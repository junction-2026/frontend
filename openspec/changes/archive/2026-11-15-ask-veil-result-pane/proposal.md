## Why
The Ask VEIL page lists result elements as a separate checkbox list (`FocusPanel`). Parent junction-2026/project#95 asks for the full analysis result beside the chat, with the elements selectable where they are rendered, so users read the result and point VEIL at a section in one place.

## What Changes
- `/jobs/:id/ask` shows the chat at inline-start and, at inline-end, the result screen's own Verdict and detailed region (excerpt, technique tags, metrics bar, JobView with risk, Wikipedia lookup, term context, Coverage), always expanded. `FocusPanel` and its checkbox list are removed.
- Every element `focusItemsOf` produces gets an "Ask about <label>" toggle button (`aria-pressed`) on its rendered section. The selection, chips, `focus` request member, per-turn focus, Retry and the limit of 20 are unchanged.
- Result components render toggles only inside an optional focus-selection context that only the Ask page provides; `/jobs/:id` is unchanged.
- New `ask.focus.select` string; checkbox-only group headings are removed from every locale.

## Impact
Frontend only, no shared contract change: `focus` of `POST /api/v1/jobs/{id}/chat` as in shared-specs@a973ea23909d6cd5d024cea12cc364fa1516fd61 (analysis-chat-api: ChatFocusItem object, Focus kinds, element references, ChatRequest focus validation).
Files: `src/views/{AskView,ResultsView}.tsx`, `src/ask/*`, `src/job/{ResultDetail,focusSelection,Verdict,JobView,RiskScore,risk,WikipediaLookup,TermContext}.tsx|ts`, `src/job/job.css`, `src/i18n/locales/*/ask.ts`, tests.
