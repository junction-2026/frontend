# analyze-flow-ui Specification

## Purpose
Defines the Home composer that creates analysis jobs and the live analyzing view that follows a job over its event stream, as implemented against shared specs analysis-jobs-api and analysis-job-events.

## Requirements

### Requirement: Composer modes and submission
Home SHALL show a composer with Text and Social Link mode tabs as in the mock. Text mode SHALL send `{"input": {"content": <text>}}` and Social Link mode SHALL send `{"scrape": {"url": <value>}}` to `POST /api/v1/jobs` and, on 201, navigate to `/jobs/{id}/live`. The character count SHALL read `<n> chars`. The Analyze button SHALL be disabled while the content is blank after trimming or a request is in flight. Ctrl+Enter and Cmd+Enter in the textarea SHALL submit.

#### Scenario: Text submission
- **WHEN** the user types "hello" and presses Analyze
- **THEN** `POST /api/v1/jobs` receives `{"input":{"content":"hello"}}` and the app navigates to `/jobs/<id>/live`

#### Scenario: URL submission
- **WHEN** the user selects Social Link, enters `https://bsky.app/profile/a/post/1` and presses Analyze
- **THEN** the body is `{"scrape":{"url":"https://bsky.app/profile/a/post/1"}}`

#### Scenario: Blank content
- **WHEN** the textarea holds only whitespace
- **THEN** the Analyze button is disabled and the count reads `3 chars` for three spaces

#### Scenario: Keyboard submit
- **WHEN** the user presses Ctrl+Enter or Cmd+Enter with content entered
- **THEN** the job is created exactly once

### Requirement: Client checks before sending
In Social Link mode the value SHALL parse as an absolute http(s) URL of at most 2048 characters; otherwise an inline error SHALL be shown and nothing SHALL be sent. Text mode SHALL send any non-blank content.

#### Scenario: Invalid URL
- **WHEN** Social Link mode holds `ftp://x.org/a` or `not a url`
- **THEN** an inline error is shown and no request is made

#### Scenario: Overlong URL
- **WHEN** the URL is longer than 2048 characters
- **THEN** an inline error is shown and no request is made

### Requirement: Advanced options panel
The `Advanced options ▾` control SHALL expand a panel listing the items of `GET /api/v1/analyzers` with `selectable: true` as checkboxes (name, category, and a `disabled` hint when `enabled` is false), all checked by default. The panel SHALL NOT offer a control to turn off the final assessment. If the analyzers request fails, the panel SHALL show the error.

#### Scenario: Panel content
- **WHEN** the panel opens and the server lists a selectable, a disabled and a non-selectable analyzer
- **THEN** the first two are listed checked (the disabled one with the hint) and the non-selectable one is not listed

#### Scenario: No final assessment toggle
- **WHEN** the panel opens
- **THEN** no Final assessment control is shown

### Requirement: Submission errors
A non-201 response SHALL render an element with `role=alert` using the foundation's message mapping. For `validation_failed` each `details.fields` entry SHALL be listed; for `unknown_analyzer` the ids SHALL be listed. The entered content SHALL be kept.

#### Scenario: Validation failed
- **WHEN** the server answers 422 `validation_failed` with fields `scrape.url` and `input`
- **THEN** an alert lists both field entries and the textarea keeps its value

#### Scenario: Payload too large
- **WHEN** the server answers 413 `payload_too_large`
- **THEN** the alert reads "Content is larger than 1 MiB"

#### Scenario: Unknown analyzer
- **WHEN** the server answers 422 `unknown_analyzer` with `details.analyzer_ids: ["nope"]`
- **THEN** the alert lists `nope`

### Requirement: Home copy and mock marking
The support note SHALL read "Supports Bluesky, Mastodon and web pages" in English; all Home copy SHALL come from the `home` catalog in the active locale. Home SHALL NOT render a language chip ("Auto-detect (EN, FR, AR, DE, FI)"). The two feature cards ("Unbiased Dissection", "Provenance & Signals") SHALL be wrapped in `Mock`. Home SHALL NOT render a "Private by Architecture" card. The `Try:` sample buttons SHALL fill the textarea and SHALL NOT be marked.

#### Scenario: Marked and unmarked elements
- **WHEN** Home renders
- **THEN** each feature card is inside `[data-mock]`, the sample buttons, count and support note are not, the Auto-detect chip is absent, and no "Private by Architecture" text is present

### Requirement: Live view state
The live view at `/jobs/:id/live` SHALL subscribe to job events, build state from `job.snapshot` and later events, and unsubscribe on unmount. The quote banner SHALL show `input.content` (or the scrape URL while `input` is null) as plain text, the job id and the elapsed time computed client-side from `created_at` to `finished_at` or now. The banner SHALL NOT show a cluster label or data-retention claim in any locale and SHALL render its footer row only when it has content.

#### Scenario: Scrape job before input
- **WHEN** the snapshot has `input: null` and `scrape.url: https://x.org/a`
- **THEN** the banner shows `https://x.org/a`

#### Scenario: Content is text
- **WHEN** the content is `<img src=x onerror=alert(1)>`
- **THEN** it is shown literally and no element is created from it

#### Scenario: No cluster or retention labels
- **WHEN** the live view renders for any job in any supported locale
- **THEN** no cluster text (e.g. `Cluster: eu-west-alpha-2`) and no retention text (e.g. `Zero-retention ephemeral pipeline`) is present and the banner contains no empty footer row

### Requirement: Live progress
The progress bar and the text `Stage <done> of <total> completed` SHALL come from the latest Progress (`done`, `total`); an event whose `seq` is not greater than the last applied one SHALL NOT change the state. Before `analysis.planned` the phase text of the scrape Activity SHALL be shown. The mock's worker load and remaining time SHALL NOT be shown as real values.

#### Scenario: Out-of-order progress
- **WHEN** an event with `seq` 7 and progress 3 of 8 is followed by one with `seq` 6 and progress 2 of 8
- **THEN** the view shows `Stage 3 of 8 completed`

#### Scenario: Scrape phase
- **WHEN** `scrape.started` carries an Activity with text "Reading the post" and no plan exists yet
- **THEN** that text is shown

### Requirement: Active Worker Ledger rows
The `Active Worker Ledger` SHALL list one row per PlanEntry in plan order. A row title SHALL be the catalog title of the Activity `key`, or before the analyzer started the catalog name of its id; the Activity `text` or PlanEntry `name` for a key or id the catalog lacks. The detail SHALL be the Activity detail localized from `params`, or for a settled row the availability note, or the preview counts when a preview exists, all as plain text. The duration SHALL come from `duration_ms`.

#### Scenario: Title before and after start
- **WHEN** a plan entry `news_search` has not started and then `analyzer.started` carries the Activity key `news_search`
- **THEN** its row title is first the catalog name of `news_search` and then the catalog title of the key

#### Scenario: Detail from params
- **WHEN** the locale is `de` and the Activity is `news_search` with `params.languages: ["de", "en"]`
- **THEN** the detail is the German phrase naming Deutsch and Englisch, not the English API detail

### Requirement: Finalizer row and hide toggle
The finalizer row SHALL follow `analysis.finalizing`, `analysis.finalized` and `analysis.finalization_failed`. The `Hide progress details` toggle SHALL collapse the ledger.

#### Scenario: Collapse
- **WHEN** the user presses `Hide progress details`
- **THEN** the ledger rows are not shown

### Requirement: Active Worker Ledger status pills
The status pill SHALL be grey `Pending` for pending, blue `Running` for running, green `Completed` for succeeded, orange with `error.code` for failed (`timeout` shown as `Timed out`) and grey `Skipped` with the note for skipped.

#### Scenario: Rows from snapshot and events
- **WHEN** a snapshot with a 3-entry plan is followed by `analyzer.started`, `analyzer.succeeded` and `analyzer.failed` with `error.code: timeout`
- **THEN** three rows show in plan order with Completed and Timed out pills and durations

#### Scenario: Skipped with note
- **WHEN** an analyzer is skipped with note "Not run: no claims"
- **THEN** its row shows `Skipped` and the note

### Requirement: Scrape failure card
On `scrape.failed`, or `job.failed` with a failed scrape, the view SHALL show the `Unable to retrieve social post` card with `scrape.error.code` and message as plain text and a `Switch to Text Input` link to `/`. No analyzer rows SHALL be shown.

#### Scenario: Account not found
- **WHEN** `scrape.failed` carries `error.code: account_not_found`
- **THEN** the card shows that code and message, the link points to `/` and the ledger is absent

### Requirement: Terminal states
On `job.completed` the view SHALL navigate with replace to `/jobs/{id}`. On `job.cancelled` it SHALL show a `Cancelled` state with the partial runs and a link to the results. On `job.failed` it SHALL show the failure. A 404 on connect SHALL show an alert. If the event stream fails after 3 reconnects the view SHALL poll `GET /api/v1/jobs/{id}` every 2000 ms until the job is done.

#### Scenario: Completed
- **WHEN** `job.completed` arrives
- **THEN** the location becomes `/jobs/<id>` without adding a history entry

#### Scenario: Missing job
- **WHEN** the job does not exist
- **THEN** an alert says it was not found

#### Scenario: Polling fallback
- **WHEN** the socket closes 4 times without delivering an event
- **THEN** the view calls `GET /api/v1/jobs/<id>` every 2000 ms until `done` is true

### Requirement: Cancel
`✕ Cancel analysis` SHALL call `POST /api/v1/jobs/{id}/cancel`. A 202 SHALL show `Cancelling…` until `job.cancelled` arrives. A 409 `job_finished` SHALL show `The job already finished` and navigate to the results. Other errors SHALL show an alert.

#### Scenario: Cancel accepted
- **WHEN** the user cancels and the server answers 202
- **THEN** `Cancelling…` is shown until `job.cancelled`, then `Cancelled`

#### Scenario: Cancel too late
- **WHEN** the server answers 409 `job_finished`
- **THEN** `The job already finished` is shown and the app navigates to `/jobs/<id>`

### Requirement: Propaganda detection confidence in ledger rows
For a settled `propaganda_detection` Active Worker Ledger row whose preview has a string `label`, the preview summary SHALL be the label, then ` · `, then `Math.round(score × 100)` as a percentage and the word `confidence` (for example `PROPAGANDA · 93% confidence`). The percentage SHALL be shown only when `score` is a finite number in [0, 1]. The score SHALL be worded as confidence in the label and never as a propaganda probability.

#### Scenario: Propaganda label with score
- **WHEN** a settled `propaganda_detection` preview is `{label: "PROPAGANDA", score: 0.934}`
- **THEN** the row detail is `PROPAGANDA · 93% confidence`

#### Scenario: Score bounds
- **WHEN** the score is 0 or 1
- **THEN** the detail ends in `0% confidence` or `100% confidence`

### Requirement: Propaganda detection summary fallbacks
When `score` is absent or invalid the `propaganda_detection` summary SHALL be the label alone. When `label` is not a string the summary SHALL be empty, so the row shows the Activity detail. The summary SHALL never contain `NaN`, `null`, `undefined` or an empty ` · ` separator. Preview summaries of all other analyzer keys SHALL be unchanged.

#### Scenario: Score absent or invalid
- **WHEN** the preview has a label and `score` is null, missing, non-finite or outside [0, 1]
- **THEN** the row detail is the label alone

#### Scenario: Label missing
- **WHEN** the preview has a score but no string label
- **THEN** the summary is empty and the row shows the Activity detail

### Requirement: Home feature grid layout
The Home feature row SHALL lay out its cards in as many equal-width columns as there are cards (two) above 960px viewport width, with no empty grid track, and in a single column at 960px and below.

#### Scenario: Wide viewport
- **WHEN** the viewport is wider than 960px
- **THEN** the two cards fill two equal columns

### Requirement: Analyzing copy from the analysis catalog
All fixed text of `/jobs/:id/live` (banner, heading, phase line, stage counter, progress toggle, cancel controls, scrape failure card, ledger title, ledger status pills and preview summaries) SHALL come from the `analysis` catalog in the active locale for en, fr, ar, de and fi. The English text quoted in the other Analyzing requirements of this capability is the `en` catalog value.

#### Scenario: Another locale
- **WHEN** the active locale is `de` and a snapshot with status `running` arrives
- **THEN** the heading reads "Ihr Inhalt wird analysiert...", the counter reads "Schritt 0 von 4 abgeschlossen", a pending row reads "Ausstehend", and the content and activity text are the API strings unchanged

#### Scenario: Language switch
- **WHEN** the user switches the language while the page is open
- **THEN** the page re-renders in the new language without a reload, including a cancel error already shown

### Requirement: Analyzing enum labels and API strings
Job status in the banner pill and analyzer status in a ledger pill SHALL map the enum value to a catalog key; an unknown value SHALL render as the raw value. Activity `text` and `detail` SHALL be localized from `key` and `params` and kept as sent only for a key the catalog lacks. Other API strings (unknown analyzer names, error `code` and `message`, the preview `label` and source language) SHALL be shown unchanged, not passed through `t()`. The submitted content SHALL be in `<bdi dir="auto">`.

#### Scenario: Unknown status
- **WHEN** the job status is `weird_status`
- **THEN** the banner pill shows `weird_status`

#### Scenario: Known activity key
- **WHEN** an activity with key `translation` arrives in English while the locale is `de`
- **THEN** the ledger row shows the German catalog title

#### Scenario: API text
- **WHEN** an activity with key `bot_detection` and text "Bot detection" arrives
- **THEN** the ledger row shows that text unchanged

### Requirement: Analyzing numbers and durations
Counts (stage counter, preview counts), the row position, elapsed time and ledger durations SHALL be formatted with the active locale's number formatter; the unit text comes from the catalog (en: "1.2s"). Preview counts SHALL use the plural form keys of the locale, and a propaganda-detection score SHALL be shown as a whole percent with locale formatting.

#### Scenario: German duration
- **WHEN** the locale is `de` and a ledger row ran 1234 ms
- **THEN** the row shows "1,2 s"

### Requirement: Analyzing layout in right-to-left languages
The Analyzing screen SHALL remain usable with `dir=rtl` (Arabic): the arrows inside Arabic strings sit on the side an RTL reader expects, and no part of the layout depends on physical left or right.

#### Scenario: Arabic
- **WHEN** the locale is `ar`
- **THEN** the document direction is `rtl` and the headings and controls are Arabic

### Requirement: Advanced options request body
When every selectable analyzer is checked the request SHALL omit `analyzers`, otherwise it SHALL carry the checked ids. The request SHALL omit `options`, so the server default (`finalize` true) applies, and SHALL NOT send `options.finalize: false` in any mode. If the analyzers request failed, the job SHALL be sent without `analyzers`.

#### Scenario: All analyzers checked
- **WHEN** nothing was unchecked
- **THEN** the body has no `analyzers` member

#### Scenario: Subset
- **WHEN** one of three analyzers is unchecked
- **THEN** the body has `analyzers` with the two checked ids

#### Scenario: Final assessment always requested
- **WHEN** a job is submitted in text or link mode, with or without an analyzer subset
- **THEN** the body has no `options` member

#### Scenario: Analyzers list fails
- **WHEN** `GET /api/v1/analyzers` fails
- **THEN** the panel shows the error and the next submission has no `analyzers` member

### Requirement: Home fully localized
Every static string of Home (eyebrow, title, lede, mode tabs and their label, support note, placeholders, input label, advanced options, analyzer states, character count, sample links, feature cards, error messages) SHALL come from the catalogs in en, fr, ar, de and fi. Analyzer names from the API SHALL be wrapped in `<bdi>`. The submit arrow SHALL mirror under `[dir=rtl]`. Changing the locale SHALL keep the typed input, the mode and the open panel.

#### Scenario: Home in Arabic
- **WHEN** Home is rendered in ar
- **THEN** html has lang ar and dir rtl and no static Latin-script text other than the brand "VEIL" appears

#### Scenario: Input survives a switch
- **WHEN** text is typed and the locale changes
- **THEN** the textarea keeps its value

### Requirement: Public visibility switch
The Home composer SHALL show a switch (`role="switch"`, visible label, keyboard operable, `aria-checked` reflecting its state, associated with its description through `aria-describedby`) that is on by default in both Text and Social Link modes. Switching it off SHALL make the request body carry `"public": false`; leaving it on SHALL omit the `public` member. After a 201 the app navigates to `/jobs/{id}/live` for public and non-public jobs alike.

#### Scenario: Default on
- **WHEN** Home is shown
- **THEN** the switch labelled "Public" has `aria-checked="true"` and a text submission sends `{"input":{"content":"hello"}}`

#### Scenario: Switched off
- **WHEN** the user turns the switch off (by click or by Space while focused) and submits text or a link
- **THEN** the body contains `"public": false` next to `input` or `scrape`

### Requirement: Visibility hint copy
A short description under the switch SHALL state that non-public jobs are not shown in History but anyone with the link can open them. The copy SHALL NOT call such jobs private or secret.

#### Scenario: Hint present
- **WHEN** Home is shown in any supported locale
- **THEN** the description is visible and referenced by the switch's `aria-describedby`

### Requirement: Visibility switch is not persisted
The switch state SHALL reset to public after a successful submission and on every fresh visit to Home, and SHALL NOT be stored.

#### Scenario: Fresh visit
- **WHEN** the user turns the switch off and later opens Home again
- **THEN** the switch is on

### Requirement: Progress ring
The live view ring SHALL be an inline SVG of 56px outer diameter with a 2.5px stroke, track `var(--progress-track)`, arc `var(--progress-active)` with a round linecap, and one centered activity (pulse) icon of about 18px in `var(--progress-active)`. It SHALL stay `aria-hidden` and SHALL NOT display a fabricated percentage; the determinate value remains the progress bar.

#### Scenario: Running
- **WHEN** the job is not terminal
- **THEN** the ring has no `idle` class and rotates indeterminately (about 1.2s, linear)

#### Scenario: Terminal
- **WHEN** the job is terminal
- **THEN** the ring has the `idle` class and does not animate

#### Scenario: Reduced motion
- **WHEN** `prefers-reduced-motion: reduce` applies
- **THEN** the ring does not animate

### Requirement: Analyzing layout
The quote banner, progress panel and Active Worker Ledger SHALL share one centered column of max-width 780px with inline padding of at least 16px below 640px. Only logical properties are used, so the layout holds under `dir="rtl"`. The existing Live view state, Live progress, ledger, cancel, terminal and RTL requirements are unchanged.

#### Scenario: Column width
- **WHEN** the analyzing view is rendered
- **THEN** the banner, progress panel and ledger are inside one column with `max-width: 780px`

### Requirement: Analyzing progress panel styling
The heading SHALL use weight 600, about 1.5rem and letter-spacing about -0.02em; the subtitle weight 400, about 1rem, `var(--muted)`, centered, max-width about 34rem. The progress bar is 4-6px high with track `var(--progress-track)` and fill `var(--progress-active)`. The hide-details control is a pill chip with a caret and Cancel is a text button.

#### Scenario: Bar colours
- **WHEN** progress is shown
- **THEN** the bar track is `var(--progress-track)` and its fill `var(--progress-active)`

### Requirement: Ledger header
The ledger header SHALL be a light grey band with a small uppercase, letter-spaced pool label at the inline end.

#### Scenario: Header band
- **WHEN** the ledger is shown
- **THEN** its header has the light band and the pool label at the inline end
