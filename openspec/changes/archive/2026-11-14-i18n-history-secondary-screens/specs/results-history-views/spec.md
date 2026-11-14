## ADDED Requirements
### Requirement: History localization
All fixed text of the History screen (title, filter chips, group counts, status pills, verdict tags, "Reopen Analysis →", "Excerpt unavailable", empty and loading texts, mock labels) SHALL come from the `history` catalog in the active locale; every English text quoted in the History requirements of this capability is the `en` catalog value. Job excerpts and API error messages SHALL NOT be translated. Switching language SHALL re-render the screen without reload.

#### Scenario: Arabic History
- **WHEN** the locale is `ar`
- **THEN** the heading, filter chips and "Reopen Analysis" link render with Arabic text and the document direction is rtl

#### Scenario: Switch without reload
- **WHEN** the user switches from `en` to `de` while History is open
- **THEN** the texts change to German and the list is not requested again

### Requirement: History dates and times
`dayLabel` SHALL return the translated "Today", "Yesterday" or "Unknown date", and otherwise the date formatted with the active locale (year numeric, month short, day numeric). `relativeTime` SHALL use `Intl.RelativeTimeFormat` for the active locale, except under one minute where it SHALL return the catalog text "just now". Both functions SHALL take the locale and the translator as parameters.

#### Scenario: German day label and relative time
- **WHEN** the locale is `de`, an item was created yesterday and another three hours ago
- **THEN** the group label is "Gestern" and the relative time is "vor 3 Stunden"

#### Scenario: Finnish just now
- **WHEN** the locale is `fi` and the item is 30 seconds old
- **THEN** the relative time is "juuri nyt"

### Requirement: History right-to-left layout
`history.css` SHALL use logical properties (`text-align: start|end`, inline margins and borders) so the History screen mirrors under `dir=rtl`.

#### Scenario: No physical direction
- **WHEN** `history.css` is inspected
- **THEN** it contains no `left`/`right` text alignment, margin, padding, border or offset
