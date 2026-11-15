## Decisions
- `CodeBlock` moves to `src/views/apiDocs/CodeBlock.tsx` and optionally takes children (the highlighted nodes), so the response panel reuses the same copy behaviour and `.api-code` styling.
- The operation switch is a native radio group in a fieldset: keyboard and screen reader behaviour for free.
- Highlighting tokenizes the pretty-printed text with a regex and emits `<span>` elements; React escapes the text, no `dangerouslySetInnerHTML`.
- One `AbortController` ref: a request is aborted on unmount and no state is set afterwards. A `busy` flag disables Send, so one request is in flight at a time.
- Elapsed time is `performance.now()` from just before `fetch` until `res.text()` resolves.
- Retry delay: `Retry-After` header if a positive integer, else `error.details.retry_after_s` if a positive integer, else omitted.
