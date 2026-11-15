## MODIFIED Requirements

### Requirement: History export
The enabled Export button SHALL page `GET /api/v1/jobs` with `limit=100` and the active `status`, `q` and `language` until `next_cursor` is null, then download one file `history-YYYY-MM-DD.csv` (local date): UTF-8 with BOM, CRLF, RFC 4180 quoting, header `id,created_at,status,finalization_status,verdict,excerpt,language`, one row per job in list order, null or missing values as empty cells. Header names are fixed and not translated. An empty history SHALL give a header-only file.

#### Scenario: Several pages
- **WHEN** the filter is Completed and the list has three pages
- **THEN** three requests with `limit=100&status=completed` (cursors in turn) are sent and one file with all rows is downloaded

#### Scenario: Quoting
- **WHEN** an excerpt is `say "hi", ok` followed by a line break and `bye`
- **THEN** its cell is quoted with the inner quotes doubled

#### Scenario: Empty history
- **WHEN** the list is empty
- **THEN** a file with only the header row is downloaded and no error is shown

#### Scenario: Language filter and column
- **WHEN** the language filter is Russian and the user exports
- **THEN** the requests carry `language=ru` and each row ends with the job's language code, empty when it has none

## ADDED Requirements

### Requirement: History language filter
The History filter bar SHALL have a single-select language control with a visible label (`history.language.label`) and the options All (sends no parameter), the fixed list en, de, fr, es, it, ru, uk, pl, ro, nl, pt, ar, zh, each named by `Intl.DisplayNames` in the UI locale (falling back to the code), and Unknown (`unknown`). It SHALL be keyboard operable like a native select. The chosen value SHALL be sent as `listJobs` `language` together with `status` and `q`.

#### Scenario: Options
- **WHEN** History is shown in English
- **THEN** the control offers "All languages", "English", "German", … and "Unknown" with values ``, `en`, `de`, … `unknown`

#### Scenario: Select a language
- **WHEN** the status is Failed and the user selects German
- **THEN** the list is requested with `status=failed&language=de` and no cursor

### Requirement: History language in the URL
The status, search and language SHALL be stored in the `/history` URL query (`status`, `q`, `language`), written without adding history entries and read when the screen loads; a value that is not one of the offered choices SHALL be ignored. Changing the language SHALL drop the loaded pages and fetch the first page; "Load more" SHALL send the same `status`, `q` and `language`.

#### Scenario: Reload
- **WHEN** the URL is `/history?status=failed&q=needle&language=fr`
- **THEN** the first request is `status=failed&q=needle&language=fr`, and the controls show those values

#### Scenario: Invalid value
- **WHEN** the URL has `language=deu`
- **THEN** the list is requested without `language`

#### Scenario: Paging reset
- **WHEN** the user has loaded a second page and selects a language
- **THEN** the request has no cursor and the older pages are gone

### Requirement: History language empty and error states
With a language filter and no search text, an empty first page SHALL show `history.empty.language` and a "Clear filters" button that resets status, search and language; a search keeps `history.empty.search` and also gets the button. An API error SHALL be shown as the existing localized alert.

#### Scenario: No match
- **WHEN** the language is Chinese and the list is empty
- **THEN** "No analyses in this language" and a "Clear filters" button are shown and no "Start first analysis" link

#### Scenario: Error
- **WHEN** the request with a language fails with 400 `invalid_request`
- **THEN** the alert "The request was not valid" is shown

### Requirement: History item language label
Each item SHALL show a tag with `history.language.item` and the language: its `Intl.DisplayNames` name in the UI locale, the raw code when it has no name, or `history.language.unknown` for null or a missing member.

#### Scenario: Labels
- **WHEN** items have `language` `de`, `zz`, null and no member
- **THEN** they show "Language: German", "Language: zz", "Language: Unknown" and "Language: Unknown"
