## Purpose
Defines the Ask VEIL chat screen of the frontend: a real conversation about one finished analysis, built on the shared `analysis-chat-api` endpoint `POST /api/v1/jobs/{id}/chat`, with its states, errors, history handling and plain-text rendering.

## ADDED Requirements

### Requirement: Ask route
`/jobs/:id/ask` (RouteName `ask` with `id`) SHALL render the chat for that job and load it with `GET /api/v1/jobs/{id}`. Plain `/ask` SHALL render an `<h1>` "Ask VEIL" and a localized "Choose an analysis to ask about" state with a link to `/history` and no composer. `navFor('ask')` SHALL stay `analyze`. An unknown job (404) SHALL show the not-found state.

#### Scenario: Job route
- **WHEN** the path is `/jobs/x/ask`
- **THEN** the route is `{name:'ask', id:'x'}`, the job `x` is requested and the chat is shown

#### Scenario: Legacy route
- **WHEN** the path is `/ask`
- **THEN** a "Choose an analysis to ask about" state with a link to `/history` is shown, no composer exists and the Analyze tab is active

#### Scenario: Unknown job
- **WHEN** `GET /api/v1/jobs/{id}` answers 404
- **THEN** a localized not-found message is shown and no composer exists

### Requirement: Context bar
The chat SHALL show a context bar naming the job under discussion: the verdict label of its final assessment when it has one, the source title or, without one, the input text (shortened) or the job id, taken from the Job, and a link back to `/jobs/{id}`. It SHALL NOT be wrapped in `Mock`.

#### Scenario: Context of a completed job
- **WHEN** the job has verdict `detected` and input content "Hello world"
- **THEN** the bar shows "Manipulation detected", "Hello world" and a link with `href` `/jobs/{id}`

### Requirement: Thread rendering
The thread SHALL list user and VEIL bubbles in order. Their content SHALL be rendered as React text nodes only (no `dangerouslySetInnerHTML`, Markdown or autolinking), with `white-space: pre-wrap` and `dir="auto"` on each bubble so mixed-direction text displays correctly under the `ar` locale.

#### Scenario: Markup in a reply
- **WHEN** a reply is `<img src=x onerror=alert(1)> [click](https://example.com)` over two lines
- **THEN** the characters are shown literally with the line break kept and the thread contains no `img` and no `a` created from the reply

### Requirement: Composer
The composer SHALL be a textarea limited to 2000 Unicode code points with a live counter. Enter SHALL send and Shift+Enter SHALL insert a new line. Send SHALL be disabled while the trimmed text is empty, while a request is in flight and when the job is not completed. While waiting a status region with `aria-live="polite"` SHALL show "VEIL is thinking…".

#### Scenario: Keyboard
- **WHEN** the user types "Why?" and presses Enter
- **THEN** one request is sent and the textarea is cleared; with Shift+Enter no request is sent

#### Scenario: Limit
- **WHEN** the user pastes 2500 code points
- **THEN** the textarea keeps 2000 code points and the counter shows 2000

#### Scenario: Waiting
- **WHEN** a request is in flight
- **THEN** the thinking text is shown in the polite live region and Send is disabled

### Requirement: Chat request
Sending SHALL `POST /api/v1/jobs/{id}/chat` with a ChatRequest holding the thread (oldest first, the new user question last) and `language` set to the active UI locale. At most the latest 40 messages SHALL be sent and a request SHALL NOT start while an assistant message is last. The reply `message` SHALL be appended as a VEIL bubble; follow-up questions SHALL carry the earlier turns. After a reply with `history_truncated: true` a localized note SHALL say that older messages are no longer used.

#### Scenario: Follow-up
- **WHEN** one question was answered and the user asks a second
- **THEN** the second request body has three messages (user, assistant, user) and the active language

#### Scenario: Long thread
- **WHEN** the thread has 50 messages and the user asks another
- **THEN** the request carries the latest 40 messages

#### Scenario: Truncated history
- **WHEN** the reply has `history_truncated: true`
- **THEN** the note "Older messages are no longer used for answers." (localized) is shown

### Requirement: Thread storage
The thread SHALL be kept in `sessionStorage` under a per-job key, so a reload in the same tab restores it; storage failures SHALL be ignored. A restored thread whose last message is the user's SHALL show a Retry action.

#### Scenario: Reload
- **WHEN** the screen of the same job is mounted again in the same tab
- **THEN** the earlier bubbles are shown

### Requirement: Job state
A job whose `status` is not `completed` (or a `409 job_not_completed` answer) SHALL disable the composer and show a localized explanation: one text for queued or running jobs, another for failed or cancelled ones. The explanation SHALL follow the job as it is polled to completion.

#### Scenario: Running job
- **WHEN** the job is `running`
- **THEN** the textarea and Send are disabled and the "can answer once the analysis has finished" text is shown

#### Scenario: Failed job
- **WHEN** the job is `failed`
- **THEN** the composer is disabled and the "did not finish" text is shown

#### Scenario: Conflict
- **WHEN** the chat answers 409 `job_not_completed` with `details.status` `failed`
- **THEN** the composer is disabled and the failed-job text is shown

### Requirement: Chat errors
The client SHALL give up after 125 seconds (`AbortController`). A failed request SHALL add an error bubble with a localized message per code (`chat_unavailable`, `chat_timeout`, `rate_limited` with the number of seconds from `details.retry_after_s`, `validation_failed`, network error, client timeout) and a Retry action that sends the same request again; the user's question SHALL stay in the thread and nothing SHALL throw.

#### Scenario: Unavailable then retry
- **WHEN** the chat answers 503 `chat_unavailable` and the user presses Retry and the next answer is 200
- **THEN** the error bubble gives way to the VEIL answer and both requests carry the same messages

#### Scenario: Rate limited
- **WHEN** the chat answers 429 `rate_limited` with `retry_after_s` 7
- **THEN** the error bubble says to wait 7 seconds

#### Scenario: Client timeout
- **WHEN** no response arrives within 125 seconds
- **THEN** the request is aborted and a timeout error bubble with Retry is shown

### Requirement: Starter questions
Static starter questions SHALL be shown, localized, only for an empty thread of a completed job; clicking one SHALL send it as a real request. They SHALL NOT be wrapped in `Mock`.

#### Scenario: Suggestion
- **WHEN** the user clicks a starter question
- **THEN** it is sent and appears as a user bubble, and the starters disappear

### Requirement: Ask copy in every locale
All Ask text (including chat error copy) SHALL be in the `ask` catalog namespace for en, de, fr, fi, ar and ru, with the brand "VEIL" verbatim; Arabic renders right-to-left. No `Mock` wrapper and no "No backend for Ask VEIL" label SHALL remain on the screen.

#### Scenario: Arabic chat
- **WHEN** the locale is `ar` and `/jobs/j/ask` is rendered
- **THEN** the document direction is rtl and no static Latin-script text other than the brand appears
