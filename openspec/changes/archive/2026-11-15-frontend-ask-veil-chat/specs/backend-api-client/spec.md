## ADDED Requirements

### Requirement: Chat client
`src/api/client.ts` SHALL export `postJobChat(id, {messages, language})` for `POST /api/v1/jobs/{id}/chat` (shared analysis-chat-api), returning `{ok, data}` or `{ok:false, error}` and never throwing, with the id URL-encoded and a JSON body. `ChatMessage` and `ChatReply` types SHALL be tolerant: unknown members are ignored.

#### Scenario: Request
- **WHEN** `postJobChat('a/b', {messages:[{role:'user', content:'hi'}], language:'de'})` is called
- **THEN** a `POST` to `/api/v1/jobs/a%2Fb/chat` with that JSON body is sent

### Requirement: Chat client timeout
`postJobChat` SHALL abort the request after 125 seconds and then yield code `timeout` (status 0) instead of `network_error`.

#### Scenario: Timeout
- **WHEN** no response arrives within 125 seconds
- **THEN** the request is aborted and the result is `{ok:false}` with code `timeout`

### Requirement: Chat error messages
`errorMessage` SHALL map `chat_unavailable`, `chat_timeout`, `rate_limited` (with the seconds of `details.retry_after_s`), `job_not_completed` and `timeout` to texts of the `ask.errors.*` catalog without changing any existing mapping.

#### Scenario: Rate limit copy
- **WHEN** the error is `rate_limited` with `details.retry_after_s` 7
- **THEN** the copy says to wait 7 seconds
