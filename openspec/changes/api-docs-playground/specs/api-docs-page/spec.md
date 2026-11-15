## MODIFIED Requirements

### Requirement: API docs page needs no backend
The page SHALL render without authentication and SHALL NOT call `fetch` on render or on locale change. Requests SHALL happen only when the user activates a playground Send button.

#### Scenario: No request
- **WHEN** `ApiDocsView` renders
- **THEN** `fetch` is not called

#### Scenario: Request only on Send
- **WHEN** the user presses a playground Send button
- **THEN** exactly one request is made

## ADDED Requirements

### Requirement: Playground placement
`ApiDocsView` SHALL render a section titled by key `apiDocs.playground.title` (en `Playground`) directly before the `Try it with curl` section (`apiDocs.curl.title`), using the existing `Section` / `api-section` styling and `ui-design-foundation` tokens.

#### Scenario: Before curl
- **WHEN** the page renders
- **THEN** the `Playground` heading is the sibling directly before the `Try it with curl` section

### Requirement: Playground operations
The playground SHALL offer two operations as an accessible radio group: `Create an analysis` (`POST {base}/public/analyses`) and `Get an analysis` (`GET {base}/public/analyses/{id}`). `{base}` SHALL be `window.location.origin + '/api/v1'`. The method and full URL of the selected operation SHALL be shown as `dir="ltr"` code.

#### Scenario: Selected operation shown
- **WHEN** the origin is `https://example.test` and Create is selected
- **THEN** `POST https://example.test/api/v1/public/analyses` is shown in `dir="ltr"` code

### Requirement: Playground create form
Create SHALL have a labelled monospace textarea (`dir="ltr"`, spellcheck off) prefilled with `JSON.stringify(<post + comments example body of the curl example>, null, 2)`, and a Reset control that restores that text.

#### Scenario: Reset
- **WHEN** the user edits the textarea and presses Reset
- **THEN** the textarea holds the prefilled example again

### Requirement: Playground get form
Get SHALL have a labelled id text input. After a Create response with a 2xx status whose JSON body has a string `id`, the input SHALL be set to that id and the operation SHALL stay on Create. An empty or whitespace-only id SHALL disable Send for Get. The id SHALL be escaped with `encodeURIComponent` in the URL path.

#### Scenario: Id prefill
- **WHEN** Create answers 201 with `{"id": "j_1"}`
- **THEN** the Get id input holds `j_1` and Create is still selected

#### Scenario: Empty id
- **WHEN** Get is selected and the id is blank
- **THEN** Send is disabled

### Requirement: Playground request shape
Create SHALL call `fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: <textarea text unchanged>, credentials: 'omit'})`. Get SHALL call `fetch(url, {method: 'GET', headers: {Accept: 'application/json'}, credentials: 'omit'})`. Neither SHALL set an `Authorization` header or any custom header.

#### Scenario: No credentials
- **WHEN** either Send is pressed
- **THEN** the fetch init has `credentials: 'omit'` and no `Authorization` header

### Requirement: Playground invalid JSON hint
When the Create textarea text does not parse with `JSON.parse`, the playground SHALL show a translated inline warning tied to the textarea via `aria-describedby` and set `aria-invalid="true"`. Send SHALL stay enabled so the server's `400 invalid_request` can be seen, and the warning text says so.

#### Scenario: Broken body
- **WHEN** the textarea holds `{`
- **THEN** the warning is shown, the textarea is `aria-invalid`, and Send is enabled

### Requirement: Playground cost note
Next to the Create Send button the playground SHALL show a translated note that each Create starts a real analysis and that the public submit endpoint is rate limited.

#### Scenario: Note visible
- **WHEN** Create is selected
- **THEN** the note is shown

### Requirement: Playground in-flight state
While a request is in flight, Send SHALL be disabled and show a translated `Sending…` label; only one request SHALL be in flight at a time. A request still pending on unmount SHALL be aborted with `AbortController`, with no state update after unmount.

#### Scenario: Pending request
- **WHEN** Send is pressed and the response has not arrived
- **THEN** Send is disabled and reads `Sending…`

### Requirement: Playground response panel
After a response the panel SHALL show the HTTP status code and status text, the elapsed time in ms (`performance.now()` from just before `fetch` until the body has been read) and the body.

#### Scenario: Created
- **WHEN** Create answers 201 with a JSON body
- **THEN** the panel shows `201` and the elapsed ms

### Requirement: Playground JSON body display
A response body that parses as JSON SHALL be shown pretty-printed (2-space indent), read-only, `dir="ltr"`, with token highlighting (keys, strings, numbers, booleans/null) built from escaped text without `dangerouslySetInnerHTML`, and SHALL have a copy button that reuses the `CodeBlock` copy behaviour (`writeText` of the pretty-printed text, translated Copied state, silent failure).

#### Scenario: Highlighted JSON
- **WHEN** the body is a JSON object
- **THEN** it is shown pretty-printed with highlighted tokens and a copy button

### Requirement: Playground non-JSON bodies and errors
Non-2xx responses SHALL be shown the same way, with the status and the error envelope as returned (no rewriting). A body that is not JSON SHALL be shown as plain text with a translated `Response is not JSON` note; an empty body SHALL show a translated `Empty response` note. A rejected fetch SHALL show a translated network-failure message and no status.

#### Scenario: Validation error
- **WHEN** the server answers 422 with an error envelope
- **THEN** `422` and the envelope are shown unchanged

#### Scenario: Network failure
- **WHEN** fetch rejects
- **THEN** the translated network message is shown and no status

### Requirement: Playground rate limit display
For a 429 response the panel SHALL show a translated `Rate limited, retry after N s` line, where N comes from the `Retry-After` header, or else from `error.details.retry_after_s`; the line is omitted when neither is a positive integer.

#### Scenario: Header
- **WHEN** 429 carries `Retry-After: 7`
- **THEN** the line says `Rate limited, retry after 7 s`

### Requirement: Playground live region and keyboard use
The response summary (status, or the network-error message) SHALL be announced through a polite live region (`role="status"`, `aria-live="polite"`). All controls SHALL be usable by keyboard with visible focus, and every input SHALL have a visible label.

#### Scenario: Announcement
- **WHEN** a response arrives
- **THEN** the status region contains the status code and text

### Requirement: Playground has no automatic polling
No automatic polling SHALL be added; the curl poll guidance stays unchanged.

#### Scenario: Single request per Send
- **WHEN** Create answers with `done: false`
- **THEN** no further request is made until the user presses Send again

### Requirement: Playground i18n
All new copy SHALL be defined under `apiDocs.playground.*` in en, de, fr, ar, fi and ru, and the catalog completeness test SHALL pass. JSON, URLs, methods and member names stay untranslated and `dir="ltr"`.

#### Scenario: Arabic
- **WHEN** the locale is Arabic
- **THEN** the playground renders translated labels and its code stays `dir="ltr"`
