## ADDED Requirements

### Requirement: History header without meta line
The History header SHALL NOT render a meta line (ledger index, session, sync state). No History element SHALL be wrapped in `Mock`.

#### Scenario: No meta line in any locale
- **WHEN** the History screen is shown in en, fr, ar, de, fi or ru
- **THEN** no ledger index, session or synchronized text is shown and the screen has no `[data-mock]` element

### Requirement: History search
The search box SHALL be an enabled `type=search` input with the `history.search_placeholder` placeholder and the `history.search_aria` aria-label. Its value SHALL be sent trimmed as `listJobs` `q` 300 ms after the last keystroke (immediately on Enter); an empty value SHALL send no `q`.

#### Scenario: Debounced search with status
- **WHEN** the status filter is Failed and the user types "needle" and waits 300 ms
- **THEN** the list is requested with `status=failed&q=needle` and no cursor

#### Scenario: Enter
- **WHEN** the user types "needle" and presses Enter
- **THEN** the list is requested at once with `q=needle`

#### Scenario: Cleared search
- **WHEN** the user clears the input
- **THEN** the list is requested without `q` and the normal list is shown again

### Requirement: History search paging and stale answers
Changing `q` or the status SHALL drop the loaded pages and fetch the first page for the new (q, status). An answer for a previous (q, status) SHALL be ignored. "Load more" SHALL send the same `q` and `status` with the cursor.

#### Scenario: Match on a later page
- **WHEN** the only match is on page 2 of the unfiltered list and the user searches for it
- **THEN** it is shown from the first search page

#### Scenario: Load more with a query
- **WHEN** the search page has `next_cursor: "c1"` and the user presses "Load more"
- **THEN** the request carries the same `q` and `status` and `cursor=c1`

#### Scenario: Late answer
- **WHEN** the answer for the previous `q` arrives after the one for the current `q`
- **THEN** it is not shown

### Requirement: History no-match state
When `q` is non-empty and the first page is empty, the screen SHALL show `history.empty.search` with the query shown as plain text instead of the "start analysing" empty state.

#### Scenario: No match
- **WHEN** the search `<b>zzz</b>` has no items
- **THEN** "No analyses match “<b>zzz</b>”" is shown literally, without an element created, and no "Start first analysis" link

### Requirement: History export
The Export button SHALL be enabled. Clicking it SHALL page `GET /api/v1/jobs` with `limit=100` and the active `status` and `q` until `next_cursor` is null, then download one file `history-YYYY-MM-DD.csv` (local date): UTF-8 with BOM, CRLF line ends, RFC 4180 quoting, header `id,created_at,status,finalization_status,verdict,excerpt`, one row per job in list order, null or missing values as empty cells. Header names are fixed and not translated. An empty history SHALL download a header-only file.

#### Scenario: Several pages
- **WHEN** the filter is Completed and the list has three pages
- **THEN** three requests with `limit=100&status=completed` (cursors in turn) are sent and one file with all rows is downloaded

#### Scenario: Quoting
- **WHEN** an excerpt is `say "hi", ok` followed by a line break and `bye`
- **THEN** its cell is quoted with the inner quotes doubled

#### Scenario: Empty history
- **WHEN** the list is empty
- **THEN** a file with only the header row is downloaded and no error is shown

### Requirement: History export formula safety
Export SHALL prefix a single quote to any cell that starts with `=`, `+`, `-`, `@`, tab or CR.

#### Scenario: Formula excerpt
- **WHEN** an excerpt is `=SUM(A1)`
- **THEN** its cell is `'=SUM(A1)`

### Requirement: History export states
While exporting, the Export button SHALL be disabled with `aria-busy` and the label `history.exporting`. On an API error it SHALL show the localized API error with `role=alert` and download nothing. The button SHALL carry `title` and `aria-description` `history.export_hint`, stating that the export follows the active filter and search.

#### Scenario: Busy
- **WHEN** the export is running
- **THEN** the button is disabled, has `aria-busy="true"` and reads "Exporting…"

#### Scenario: Error
- **WHEN** a page request answers 400 `invalid_request`
- **THEN** "The request was not valid" is shown and no file is downloaded

### Requirement: History item excerpts
Each item SHALL show `JobSummary.excerpt` as plain text, cut at 140 characters with an ellipsis when longer. A null or missing `excerpt` SHALL show "Excerpt unavailable". No per-job `getJob` request SHALL be made for excerpts and `useExcerpts` SHALL NOT exist.

#### Scenario: Long excerpt
- **WHEN** an item's `excerpt` is `<b>` followed by 200 `x` and `</b>`
- **THEN** the first 140 characters and an ellipsis are shown literally and no `b` element is created

#### Scenario: Missing excerpt
- **WHEN** an item has `excerpt: null` or no `excerpt` member
- **THEN** "Excerpt unavailable" is shown

#### Scenario: No detail requests
- **WHEN** ten items are loaded
- **THEN** no `GET /api/v1/jobs/{id}` request is sent

## MODIFIED Requirements

### Requirement: History localization
All fixed text of the History screen (title, filter chips, group counts, status pills, verdict tags, "Reopen Analysis →", "Excerpt unavailable", export and search texts, empty and loading texts) SHALL come from the `history` catalog in the active locale; every English text quoted in the History requirements of this capability is the `en` catalog value. Job excerpts and API error messages SHALL NOT be translated. Switching language SHALL re-render the screen without reload.

#### Scenario: Arabic History
- **WHEN** the locale is `ar`
- **THEN** the heading, filter chips and "Reopen Analysis" link render with Arabic text and the document direction is rtl

#### Scenario: Switch without reload
- **WHEN** the user switches from `en` to `de` while History is open
- **THEN** the texts change to German and the list is not requested again

### Requirement: History view fully localized
Every static string of the History view (title, lede, export texts, search placeholder and aria-label, filter group and buttons, status labels, empty and error states, load-more, relative times and day headings) SHALL come from the catalogs in en, fr, ar, de and fi. Job ids and the quoted excerpt SHALL be wrapped in `<bdi>`. Dates, relative times and counts SHALL use Intl in the active locale. Changing the locale SHALL keep the selected status filter and the loaded list.

#### Scenario: History in Arabic
- **WHEN** History is rendered in ar with one job
- **THEN** it has dir rtl, no static Latin-script text other than the brand and the job id, the id and the excerpt are inside `bdi`, and the status filter stays selected after a locale switch

## REMOVED Requirements

### Requirement: History mock parts
**Reason**: Search and export now work against the backend and the meta line is gone; no History element is a mock any more.
**Migration**: None; see "History header without meta line", "History search" and "History export".

### Requirement: History excerpts
**Reason**: Excerpts no longer come from one `getJob` request per item (at most 4 in flight) but from `JobSummary.excerpt`.
**Migration**: See "History item excerpts".
