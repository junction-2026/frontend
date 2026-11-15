## MODIFIED Requirements

### Requirement: History items
Each item SHALL show the job id, a status pill, a verdict tag from `finalization.verdict` (null shows the finalization status), the relative time from `created_at` and an "Open Analysis →" link to `/jobs/{id}`.

#### Scenario: Item without verdict
- **WHEN** `finalization.verdict` is null and `finalization.status` is `pending`
- **THEN** the item shows the finalization status instead of a verdict tag

### Requirement: History item excerpts
Each item SHALL show `JobSummary.excerpt` as plain text, cut at 140 characters with an ellipsis when longer, or "Excerpt unavailable" when `excerpt` is null or missing. This text SHALL be rendered as the text of the item title link. No per-job `getJob` request SHALL be made for excerpts and `useExcerpts` SHALL NOT exist.

#### Scenario: Long excerpt
- **WHEN** an item's `excerpt` is `<b>` followed by 200 `x` and `</b>`
- **THEN** the first 140 characters and an ellipsis are shown literally and no `b` element is created

#### Scenario: Missing excerpt
- **WHEN** an item has `excerpt: null` or no `excerpt` member
- **THEN** "Excerpt unavailable" is shown

#### Scenario: No detail requests
- **WHEN** ten items are loaded
- **THEN** no `GET /api/v1/jobs/{id}` request is sent

### Requirement: History localization
All fixed text of the History screen (title, filter chips, group counts, status pills, verdict tags, "Open Analysis →", "Excerpt unavailable", export and search texts, empty and loading texts) SHALL come from the `history` catalog in the active locale; every English text quoted in the History requirements of this capability is the `en` catalog value. Job excerpts and API error messages SHALL NOT be translated. Switching language SHALL re-render the screen without reload.

#### Scenario: Arabic History
- **WHEN** the locale is `ar`
- **THEN** the heading, filter chips and "Open Analysis" link render with Arabic text and the document direction is rtl

#### Scenario: Switch without reload
- **WHEN** the user switches from `en` to `de` while History is open
- **THEN** the texts change to German and the list is not requested again

## ADDED Requirements

### Requirement: History item title link
The item title SHALL be an `h3` heading containing a client-side router link to `/jobs/{id}` (id URL-encoded), the same target as the "Open Analysis →" link. The link's accessible name SHALL be the shown excerpt or "Excerpt unavailable", it SHALL be keyboard focusable, and activating it SHALL navigate without a full page reload.

#### Scenario: Title link
- **WHEN** an item with id `a` and excerpt `short` is listed
- **THEN** its level-3 heading contains a link named "“short”" with href `/jobs/a`

#### Scenario: Missing excerpt link
- **WHEN** an item has `excerpt: null`
- **THEN** its heading contains a link named "Excerpt unavailable" with href `/jobs/{id}`

#### Scenario: Client-side navigation
- **WHEN** the title link is clicked
- **THEN** the route changes to `/jobs/{id}` without a page reload

### Requirement: History item title link styling
The title link SHALL inherit the heading's colour, font and size, SHALL show an underline on hover and a visible focus outline on `:focus-visible`, and SHALL NOT change the item layout otherwise.

#### Scenario: Hover and focus
- **WHEN** the title link is hovered or keyboard-focused
- **THEN** it is underlined on hover and shows an outline on focus

### Requirement: History open-analysis wording
The `history.reopen` catalog value SHALL mean "Open analysis" in every locale: en "Open Analysis →", de "Analyse öffnen →", fi "Avaa analyysi →", fr "Ouvrir l’analyse →", ru "Открыть анализ →", ar "فتح التحليل ←". `history.lede` and `history.empty.text` SHALL be unchanged.

#### Scenario: German
- **WHEN** the locale is `de`
- **THEN** the item action link reads "Analyse öffnen →"
