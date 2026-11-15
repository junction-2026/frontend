# api-docs-page Specification

## Purpose
Defines the public, login-free API docs page of the frontend at `/docs/api` and the top bar button that links to it, so integrators can call the public analysis API in one minute.

## Requirements

### Requirement: API docs route
The router SHALL map `/docs/api` (a trailing slash tolerated) to the route name `api-docs`, rendered by `ApiDocsView`. `navFor('api-docs')` SHALL return null so no primary nav tab is active. Unknown paths SHALL still render Home and `/` SHALL stay Home.

#### Scenario: Docs path
- **WHEN** the path is `/docs/api` or `/docs/api/`
- **THEN** the route is `{name: 'api-docs'}` and no Analyze, Explore or History tab is active

#### Scenario: Other paths unchanged
- **WHEN** the path is `/` or `/docs`
- **THEN** the route is `home`

### Requirement: Integrate API button
After the History nav item the top bar SHALL show a link-button with the text of key `shell.integrate_api` (en `Integrate API`) to `/docs/api`, styled as a grey neutral-surface button with the existing token set (not the active-tab or accent style) and with `aria-current="page"` on `/docs/api`. It SHALL keep the top bar's spacing in LTR and RTL at 1440, 768 and 390px: no overflow at 390px; the label may wrap or the button may shrink but stays visible.

#### Scenario: Button follows History
- **WHEN** the top bar renders in English
- **THEN** the link `Integrate API` with href `/docs/api` comes directly after the `History` link

#### Scenario: Current page
- **WHEN** the path is `/docs/api`
- **THEN** the button has `aria-current="page"`

### Requirement: API docs page needs no backend
The page SHALL render without authentication and SHALL NOT call `fetch` on render or on locale change. Requests SHALL happen only when the user activates a playground Send button.

#### Scenario: No request
- **WHEN** `ApiDocsView` renders
- **THEN** `fetch` is not called

#### Scenario: Request only on Send
- **WHEN** the user presses a playground Send button
- **THEN** exactly one request is made

### Requirement: API docs base URL
The page SHALL compute the base URL as `window.location.origin + '/api/v1'` and use that origin in every curl example.

#### Scenario: Mocked origin
- **WHEN** the origin is `https://example.test`
- **THEN** the base URL block is `https://example.test/api/v1` and both curl commands start from `https://example.test/api/v1/public/analyses`

### Requirement: API docs content
The page SHALL state that no authentication (API key, token, cookie, Authorization header) is required, and that each request creates one analysis in the same pipeline as the web UI, whose id also opens at `/jobs/<id>`.

#### Scenario: Statements present
- **WHEN** the page renders in English
- **THEN** it says no authentication is required and that the analysis id opens at `/jobs/<id>`

### Requirement: API docs request examples
The page SHALL show three JSON bodies for `POST /api/v1/public/analyses`: post only `{"post": "<sample>"}`, comments only `{"comments": ["<sample>", "<sample>"]}` and post + comments `{"post": "<sample>", "comments": ["<sample>", "<sample>"]}`, and SHALL mention that `url` is the alternative to pasted text and that comments are limited to 100.

#### Scenario: Three valid bodies
- **WHEN** the bodies are parsed as JSON
- **THEN** their top-level members are exactly `post`; `comments`; `post` and `comments`

### Requirement: API docs curl examples
The page SHALL show `curl -s -X POST <origin>/api/v1/public/analyses -H 'Content-Type: application/json' -d '<post + comments body>'` and `curl -s <origin>/api/v1/public/analyses/<id>`, without an Authorization header, and SHALL say to poll the get until `done` is `true` (every 2-5 s, honouring `Retry-After` on 429).

#### Scenario: No credentials in curl
- **WHEN** the curl commands are read
- **THEN** neither contains `Authorization`

### Requirement: API docs response fields
The page SHALL list every PublicAnalysis member of public-analysis-api with a one-line meaning, including that `confidence` is not a propaganda probability, `bot_signal` describes the text not the account, null means no lookup and `[]` means nothing found, and that readers must ignore unknown members. It SHALL show an example completed response.

#### Scenario: Every member listed
- **WHEN** the page renders
- **THEN** each of id, status, done, created_at, finished_at, coverage, input, finalization_status, result, techniques, bot_signal, evidence, error and share_url appears

### Requirement: API docs errors
The page SHALL list the submit and get errors 429 `rate_limited`, 413 `payload_too_large`, 400 `invalid_request`, 422 `validation_failed`, 400 `missing_content`, 503 `scrape_unavailable` and 404 `not_found`.

#### Scenario: Error codes shown
- **WHEN** the page renders
- **THEN** all seven codes appear with their status

### Requirement: API docs copy buttons
Each code block SHALL have a copy button that writes the block's exact text with `navigator.clipboard.writeText` and shows a translated "Copied" state. When the clipboard is unavailable or rejects, it SHALL fail silently, with no uncaught error.

#### Scenario: Copy
- **WHEN** the copy button of a block is clicked
- **THEN** `writeText` receives the block's text and the button reads "Copied"

#### Scenario: Clipboard unavailable
- **WHEN** `navigator.clipboard` is undefined or `writeText` rejects
- **THEN** no error is thrown and the button keeps its "Copy" label

### Requirement: API docs i18n
`shell.integrate_api` and an `apiDocs` catalog (prose, headings, field descriptions, copy and copied labels) SHALL exist in en, de, fr, ar, fi and ru. Code blocks, JSON, endpoint paths and member names SHALL stay untranslated, isolated as untranslatable fragments and rendered `dir="ltr"`.

#### Scenario: Arabic
- **WHEN** the locale is `ar`
- **THEN** the page text is Arabic and every code block has `dir="ltr"`

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
