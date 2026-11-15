## Purpose
Defines the public, login-free API docs page of the frontend at `/docs/api` and the top bar button that links to it, so integrators can call the public analysis API in one minute.

## ADDED Requirements

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
The page SHALL render without authentication and SHALL NOT call any backend endpoint.

#### Scenario: No request
- **WHEN** `ApiDocsView` renders
- **THEN** `fetch` is not called

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
