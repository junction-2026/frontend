## Purpose
Defines the Open Graph and Twitter link-preview cards that the nginx container injects into the served HTML, so that shared links to the app and to analysis jobs show a meaningful preview without running the SPA.

## ADDED Requirements

### Requirement: Link preview cards
The frontend container SHALL add a link-preview card block to the `<head>` of every HTML route response, chosen by `cardForJob`/`genericCard` of `nginx/og.js`, for every user agent. The card rules of the following requirements apply.

#### Scenario: Same document for all agents
- **WHEN** `/` is requested with `-A Twitterbot` and with a browser User-Agent
- **THEN** both responses are identical and contain the card

### Requirement: Card renderer module
`nginx/og.js` SHALL be a dependency-free ES module that runs under njs (no Node APIs, only a default export, no `for...of`, no default parameters) and that vitest can import. Its default export SHALL be an object that has at least `renderHead(card)`, a pure function returning the card HTML block, and `cardForJob(origin, id, jobOrNull)`, a pure function returning at least `{title, description, url, image, imageAlt}`.

#### Scenario: Pure functions
- **WHEN** `cardForJob` is called with the same arguments twice
- **THEN** it returns equal cards and performs no I/O

### Requirement: Generic card
The generic card SHALL have og:type `website`, og:site_name `VEIL`, og:title `VEIL / Intelligence`, one fixed product sentence of at most 200 characters as og:description and `<meta name="description">`, og:url `<PUBLIC_ORIGIN>/`, and og:image `<PUBLIC_ORIGIN>/og/site.png`. Every route without a specific card (`/`, `/ask`, `/history`, unknown paths, `/?job=<id>`) SHALL use it.

#### Scenario: Home
- **WHEN** `GET /` is requested with `-A Twitterbot` and `PUBLIC_ORIGIN=https://stiriri.dev`
- **THEN** the response has og:type `website`, og:title `VEIL / Intelligence` and og:image `https://stiriri.dev/og/site.png`

#### Scenario: Other routes
- **WHEN** `/history` or `/unknown` is requested
- **THEN** the generic card is returned with status 200

### Requirement: Tag set
Every card SHALL emit `<meta name="description">`, og:type, og:site_name, og:title, og:description, og:url, og:image, og:image:width `1200`, og:image:height `630`, og:image:type `image/png`, og:image:alt, twitter:card `summary_large_image`, twitter:title, twitter:description, twitter:image and twitter:image:alt, and SHALL replace `<title>` with the card title. Job cards SHALL use og:type `article`.

#### Scenario: Full tag set
- **WHEN** any card is rendered
- **THEN** all listed tags are present exactly once

### Requirement: Card block markers
The card block SHALL be delimited by `<!-- og:start -->` and `<!-- og:end -->` and SHALL replace the default block of `index.html` instead of duplicating it; when the markers are missing it SHALL be inserted before `</head>`.

#### Scenario: Replacement
- **WHEN** a card is injected into an `index.html` that has the markers
- **THEN** the markers occur once and the default tags are gone

### Requirement: Job card routes
`/jobs/{id}`, `/jobs/{id}/detail` and `/jobs/{id}/live`, where `{id}` matches `^[A-Za-z0-9_-]{1,64}$`, SHALL get a job card whose og:url is `<PUBLIC_ORIGIN>/jobs/{id}`. A malformed id SHALL get the generic card without a backend call.

#### Scenario: Detail route
- **WHEN** `/jobs/abc/detail` is requested
- **THEN** og:url is `<PUBLIC_ORIGIN>/jobs/abc`

#### Scenario: Malformed id
- **WHEN** `/jobs/a%20b` is requested
- **THEN** the generic card is returned and the backend receives no request

### Requirement: Verdict card
For a job with `done` true, finalization status `completed` and a result, og:title SHALL be `VEIL verdict: <label>` with label `Manipulation detected`, `No manipulation indicators` or `Uncertain` for verdict `detected`, `not_detected` or `uncertain`; any other verdict value SHALL map to `uncertain`. og:image SHALL be `<PUBLIC_ORIGIN>/og/verdict-<detected|not_detected|uncertain>.png` and the image alt SHALL name the verdict label.

#### Scenario: Image
- **WHEN** the verdict is `not_detected`
- **THEN** og:image ends with `/og/verdict-not_detected.png` and the image alt contains `No manipulation indicators`

### Requirement: Verdict card description
The verdict card description SHALL be the verdict heading (`Yes, propaganda detected.`, `No clear signs of propaganda.` or `We're not sure yet.`) followed by a space and `user_text` with whitespace collapsed, truncated to at most 200 characters on a code-point boundary and ending with `…` when truncated.

#### Scenario: Detected
- **WHEN** the job's verdict is `detected` and `user_text` is `Because.`
- **THEN** og:title is `VEIL verdict: Manipulation detected`, og:description is `Yes, propaganda detected. Because.` and og:image ends with `/og/verdict-detected.png`

#### Scenario: Unknown verdict
- **WHEN** the verdict is `suspicious`
- **THEN** the uncertain card is returned

#### Scenario: Truncation at a multi-byte character
- **WHEN** a 4-byte character straddles the 200 character limit
- **THEN** the description has at most 200 code points, ends with `…` and contains no lone surrogate

### Requirement: In-progress card
A job that is not done, or done with finalization status `pending` or `running`, SHALL get title `VEIL analysis in progress`, description `The analysis of this content is still running. Open the link to follow it live.` and image `/og/pending.png`.

#### Scenario: Running job
- **WHEN** the job has `done` false
- **THEN** the in-progress card is returned

### Requirement: Unavailable card
A done job with status `failed` or `cancelled`, or finalization `failed` or `skipped`, or a null result SHALL get title `VEIL analysis unavailable`, description `No final assessment is available for this analysis.` and image `/og/unavailable.png`. Neither neutral card SHALL state or imply a verdict.

#### Scenario: Cancelled or skipped
- **WHEN** the job is done with status `cancelled`, or with finalization `skipped`
- **THEN** the unavailable card is returned

### Requirement: Fallbacks
A backend 404 SHALL give the generic card. Any other non-200 status, invalid JSON, or a subrequest that does not answer within 2 s SHALL also give the generic card. The HTTP status of the HTML response SHALL always be 200. A job response of any size up to the nginx subrequest buffer (32 MiB; the API limits a request body to 1 MiB) SHALL produce its card, never an empty reply.

#### Scenario: Backend failure
- **WHEN** the backend answers 500, 404, invalid JSON or after 4 s
- **THEN** the response is 200 with the generic card and the SPA shell

#### Scenario: Large job
- **WHEN** the job response is 5 MB
- **THEN** the response is 200 with the SPA shell and the job's card

### Requirement: Content limits
A card SHALL NOT include `input.content`, `input.source.*`, `scrape.url` or any analyzer result. It SHALL NOT include confidence in any form (analysis-jobs-api, Confidence semantics).

#### Scenario: No private content
- **WHEN** a verdict card is rendered for a job with input content, a source title, a scrape URL and confidence `0.8731`
- **THEN** none of those values appears in the HTML

### Requirement: Escaping
Every attribute value and the `<title>` text SHALL be escaped for `&`, `<`, `>`, `"` and `'` (as `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`) after truncation, so an escape sequence is never cut. `user_text` SHALL be treated as plain text (analysis-jobs-api, User text rendering).

#### Scenario: Markup in user_text
- **WHEN** `user_text` is `<script>"'&`
- **THEN** the description contains `&lt;script&gt;&quot;&#39;&amp;` and no `<script>`

### Requirement: Public origin
The env var `PUBLIC_ORIGIN` (scheme, host and optional port; a trailing slash is stripped) SHALL prefix every og:url and image URL. Its default SHALL be `http://localhost`; it is required in production (for example `https://stiriri.dev`). It SHALL reach njs through `js_var $og_origin` and the template substitution and SHALL NOT be hard-coded.

#### Scenario: Trailing slash
- **WHEN** `PUBLIC_ORIGIN` is `https://stiriri.dev/`
- **THEN** og:image is `https://stiriri.dev/og/site.png`

### Requirement: Static default card
The source `index.html` SHALL contain the generic card tags with root-relative image URLs between the `og:start` and `og:end` markers, so that `vite dev` and `vite preview` render a valid head.

#### Scenario: Dev head
- **WHEN** `index.html` is read from the repository
- **THEN** it has og:image `/og/site.png` and twitter:card `summary_large_image`

### Requirement: Card images
`public/og/site.png`, `verdict-detected.png`, `verdict-not_detected.png`, `verdict-uncertain.png`, `pending.png` and `unavailable.png` SHALL be 1200x630 PNGs of at most 300 KB, in the ui-design-foundation colours, legible at 600x315, with the verdict label rendered as text and no confidence number. The generator `scripts/og-images.py` SHALL be committed with them.

#### Scenario: Image size
- **WHEN** a test reads the PNG IHDR of each file
- **THEN** the dimensions are 1200x630 and the file size is at most 300 KB

### Requirement: Container smoke script
`scripts/og-smoke.sh` SHALL build the image, start it with a stub backend and check with `curl -A Twitterbot` that `/`, `/jobs/<detected>`, `/jobs/<running>`, `/jobs/<unknown>` and the failure fallbacks return status 200, the SPA shell and the expected tags. It is run by the implementer and is not part of repo-ci.

#### Scenario: Smoke run
- **WHEN** `scripts/og-smoke.sh` runs against a working image
- **THEN** it prints `ok` per route and exits 0
