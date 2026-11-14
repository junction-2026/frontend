## Context
Shared contract: `analysis-chat-api` @ 5f4e9e4789a043c2ee8620f54fc3da58cea1cb86 (stateless server, client-sent history, plain-text replies, 120 s client wait).

## Decisions
- **State in a hook** (`src/ask/useChat.ts`): thread, pending, error, 409 conflict, `history_truncated`. The thread is persisted in `sessionStorage` under `veil.ask.<jobId>` so a reload or a language switch keeps it, but nothing outlives the tab.
- **Job loading reuses `useJob`** (polls until terminal), so a running job enables the composer when it completes.
- **Timeout in the client**: `postJobChat` owns an `AbortController` (125 s) and reports `timeout` (status 0) instead of `network_error` when it fired; the view needs no timer.
- **Retry** resends the same thread, whose last message is the unanswered user question; a request never starts with an assistant message last. A thread restored with an unanswered question shows a Retry bubble.
- **Plain text only**: replies and questions are React text nodes; `white-space: pre-wrap` keeps line breaks, `dir="auto"` isolates mixed direction.
- **Errors**: `errorMessage` gets the new codes (`chat_unavailable`, `chat_timeout`, `rate_limited`, `job_not_completed`, `timeout`) from the `ask` namespace without touching existing cases; the chat shows `validation_failed` with an Ask-specific sentence.
- **nginx**: a regex location for the chat path, as the events location does, with `proxy_read_timeout`/`proxy_send_timeout` 120s (server answers within 100 s).

## Risks
- A backend that is not deployed yet answers 404/503; the UI shows the localized error and Retry, nothing crashes.
