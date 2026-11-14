## ADDED Requirements
### Requirement: Analyzing copy from the analysis catalog
All fixed text of `/jobs/:id/live` (banner, heading, phase line, stage counter, progress toggle, cancel controls, scrape failure card, ledger title, ledger status pills and preview summaries) SHALL come from the `analysis` catalog in the active locale for en, fr, ar, de and fi. The English text quoted in the other Analyzing requirements of this capability is the `en` catalog value.

#### Scenario: Another locale
- **WHEN** the active locale is `de` and a snapshot with status `running` arrives
- **THEN** the heading reads "Ihr Inhalt wird analysiert...", the counter reads "Schritt 0 von 4 abgeschlossen", a pending row reads "Ausstehend", and the content and activity text are the API strings unchanged

#### Scenario: Language switch
- **WHEN** the user switches the language while the page is open
- **THEN** the page re-renders in the new language without a reload, including a cancel error already shown

### Requirement: Analyzing enum labels and API strings
Job status in the banner pill and analyzer status in a ledger pill SHALL map the enum value to a catalog key; a value the catalog does not know SHALL render as the raw value. API-provided strings (the submitted content, activity `text` and `detail`, analyzer names and notes, error `code` and `message`, the preview `label` and source language) SHALL be shown unchanged and SHALL NOT be passed through `t()`.

#### Scenario: Unknown status
- **WHEN** the job status is `weird_status`
- **THEN** the banner pill shows `weird_status`

#### Scenario: API text
- **WHEN** an activity text arrives in English while the locale is `de`
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
