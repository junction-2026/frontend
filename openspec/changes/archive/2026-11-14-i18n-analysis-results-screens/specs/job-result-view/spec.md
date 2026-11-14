## ADDED Requirements
### Requirement: Job view copy from the results catalog
All fixed text of the shared job components (highlighted excerpt labels, technique list headings, counts and notes, LLM group, analyzer coverage, metrics bar, loading and not-found copy) SHALL come from the `results` catalog in the active locale for en, fr, ar, de and fi. The English text quoted in the other requirements of this capability is the `en` catalog value. The technique count and the phrase count SHALL use the plural form keys of the locale ("no exact phrase found" is its own key).

#### Scenario: Another locale
- **WHEN** the locale is `de` and a job has one technique without a located phrase
- **THEN** the list heading reads "Erkannte Propagandatechniken", the count reads "(keine genaue Passage gefunden)", and the technique definition is the API text unchanged

### Requirement: Job view enum labels and API strings
Analyzer status and availability SHALL map the enum value to a catalog key and an unknown status SHALL render as the raw value. API-provided strings (input text and title, `plain_language` name, definition and why, technique `display`, `explanation`, finding name, definition and explanation, analyzer ids, names, notes and error codes, the API error `message` of an unknown error code) SHALL be shown unchanged and SHALL NOT be passed through `t()`.

#### Scenario: Unknown analyzer status
- **WHEN** an analyzer has status `weird_status`
- **THEN** its pill shows `weird_status`

#### Scenario: API text
- **WHEN** a technique carries a `plain_language.definition` while the locale is `de`
- **THEN** the definition is shown unchanged

### Requirement: Job view numbers
Counts in the coverage line and the metrics bar SHALL be formatted with the active locale's number formatter.

#### Scenario: Arabic digits
- **WHEN** the locale is `ar` and 3 patterns are detected
- **THEN** the Patterns metric uses the number as formatted by the `ar` locale

### Requirement: Job view layout in right-to-left languages
`job.css` and `results.css` SHALL use logical properties instead of physical left and right, so highlighted segments, the technique list and the "why" region work with `dir=rtl`; the confidence tooltip stays centered under its button in both directions.

#### Scenario: Why region
- **WHEN** the locale is `ar` and a highlight is focused
- **THEN** the "why" region keeps its accent border on the inline start side
