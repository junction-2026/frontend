## MODIFIED Requirements

### Requirement: Chat client
`src/api/client.ts` SHALL export `postJobChat(id, {messages, language, focus?})` for `POST /api/v1/jobs/{id}/chat` (shared analysis-chat-api), returning `{ok, data}` or `{ok:false, error}` and never throwing, with the id URL-encoded and a JSON body. Types are tolerant (unknown members ignored); `ChatRequest.focus` is `{kind, ref, label}[]` and is sent unchanged.

#### Scenario: Request
- **WHEN** `postJobChat('a/b', {messages:[{role:'user', content:'hi'}], language:'de'})` is called
- **THEN** a `POST` to `/api/v1/jobs/a%2Fb/chat` with that JSON body is sent

#### Scenario: Request with focus
- **WHEN** `postJobChat('j', {messages:[{role:'user', content:'why?'}], focus:[{kind:'technique', ref:'Doubt', label:'Doubt'}]})` is called
- **THEN** the JSON body has `focus` equal to that array
