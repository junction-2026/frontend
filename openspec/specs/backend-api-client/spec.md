# backend-api-client Specification

## Purpose
Defines the frontend's typed client for the analysis orchestrator REST API and its job event WebSocket, including error mapping to user copy, as implemented against shared specs api-conventions, analysis-jobs-api and analysis-job-events.

## Requirements

### Requirement: REST client
`src/api/client.ts` SHALL export `createJob(body)`, `listJobs({limit, cursor, status})`, `getJob(id)`, `cancelJob(id)` and `listAnalyzers()`, each returning `{ok:true, data}` or `{ok:false, error:{status, code, message, details?}}` and never throwing. Ids SHALL be URL-encoded.

#### Scenario: Ids encoded
- **WHEN** `getJob('a/b')` is called
- **THEN** the request URL is `/api/v1/jobs/a%2Fb`

### Requirement: REST client errors
A non-2xx response with a valid error envelope SHALL yield its `code`, `message` and `details`; a non-2xx response without an envelope SHALL yield code `http_<status>`; a network error SHALL yield code `network_error` (status 0); a 2xx response whose body is not JSON SHALL yield code `invalid_response`.

#### Scenario: Envelope error
- **WHEN** `getJob('x')` receives 404 `{"error":{"code":"not_found","message":"no"}}`
- **THEN** the result is `{ok:false, error:{status:404, code:'not_found', message:'no'}}`

#### Scenario: Non-envelope body
- **WHEN** the response is 502 with an HTML body
- **THEN** the error code is `http_502`

#### Scenario: Network failure
- **WHEN** fetch rejects
- **THEN** the result is `{ok:false}` with code `network_error` and nothing is thrown

### Requirement: Tolerant types
`src/api/types.ts` SHALL describe every object as "at least these members" (index-tolerant). A `verdictOf` helper SHALL map any unknown or missing verdict to `uncertain`, and an `isDone` helper SHALL treat a job by its `done` member regardless of its `status` value.

#### Scenario: Unknown verdict
- **WHEN** `verdictOf('maybe')` is called
- **THEN** it returns `uncertain`

### Requirement: Error messages
`src/api/errors.ts` SHALL map the codes `invalid_request`, `validation_failed` (listing `details.fields` per path), `not_found`, `method_not_allowed`, `payload_too_large`, `internal_error`, `unknown_analyzer` (listing `details.analyzer_ids`), `analyzer_not_selectable`, `job_finished` and `network_error` to copy from the active locale's `common.errors.*` catalog (en: "Content is larger than 1 MiB" for 413). Any other code SHALL return `error.message` as plain text, untranslated.

#### Scenario: Field errors
- **WHEN** a `validation_failed` error has `details.fields {"input.content": "must not be blank"}`
- **THEN** the copy mentions `input.content` and "must not be blank"

#### Scenario: Translated copy
- **WHEN** the locale is de and the error code is `not_found`
- **THEN** the German catalog text is returned, and an unknown code still returns `error.message`

### Requirement: Event stream client
`src/api/events.ts` SHALL export `subscribeJobEvents(id, handlers)` that opens `ws(s)://<location.host>/api/v1/jobs/<id>/events` and returns an unsubscribe function. It SHALL drop events whose `seq` is not greater than the last seen (always applying `job.snapshot`, which resynchronises state), ignore unknown event types and pass on `job.snapshot`, `analysis.planned`, `analyzer.*`, `scrape.*`, `analysis.finalizing`, `analysis.finalized` and `job.completed`, `job.cancelled`, `job.failed`.

#### Scenario: Duplicate seq
- **WHEN** events with seq 2, 2 and 3 arrive
- **THEN** the handler receives seq 2 and 3 once each

### Requirement: Event stream reconnect
When the connection closes without a terminal event (or the snapshot of a done job), the client SHALL reconnect with 1 s, 2 s and 4 s backoff and then report that it gave up after 3 consecutive failed reconnects; a connection that delivers an event resets this budget.

#### Scenario: Budget reset by a working connection
- **WHEN** every reconnected socket delivers a `job.snapshot` before it drops
- **THEN** the client keeps reconnecting after 1 s each time and never gives up

#### Scenario: Reconnect cap
- **WHEN** the socket closes four times in a row without delivering an event or a terminal event
- **THEN** exactly three reconnects are attempted, after 1 s, 2 s and 4 s

### Requirement: Job localization client
`src/api/client.ts` SHALL export `getJobLocalization(id, language)` for `GET /api/v1/jobs/{id}/localization?language=<code>` (shared job-text-localization), returning `{ok, data}` or `{ok:false, error}` and never throwing, with the id and language URL-encoded. `JobLocalization` and `LocalizedText` types SHALL be tolerant: unknown members are ignored and a `status` other than `original` or `translated`, or a missing `text`, SHALL count as unavailable.

#### Scenario: Request URL
- **WHEN** `getJobLocalization('a/b c', 'ar')` is called
- **THEN** the request URL is `/api/v1/jobs/a%2Fb%20c/localization?language=ar`

#### Scenario: Error response
- **WHEN** the response is 409 `job_not_finished`
- **THEN** the result is `{ok:false, error:{status:409, code:'job_not_finished', ...}}` and nothing is thrown
