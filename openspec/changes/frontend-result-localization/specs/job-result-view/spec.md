## MODIFIED Requirements

### Requirement: Technique list
Below the text the view SHALL list one entry per `detected` technique as a button, with a name, a definition, the span count and, for a known `strength` (`strong` or `weak`), a localized strength label (none otherwise). Selecting an entry SHALL emphasise only that technique's spans. A technique without spans SHALL show "no exact phrase found". Techniques SHALL be keyed by `Detection.name`, never by the displayed name.

#### Scenario: Select a technique
- **WHEN** the user presses the entry of one technique
- **THEN** only marks containing that technique are emphasised

#### Scenario: Plain-language entry
- **WHEN** a Detection has `plain_language` `{name: "Geladene Sprache", definition: "…"}`, `explanation_language` is `de` and the UI language is `de`
- **THEN** the entry shows that name as heading and that definition below it, not `display` or `explanation`

#### Scenario: Strength
- **WHEN** a Detection has `strength: "weak"` (or `"moderate"`)
- **THEN** a localized "weak signal" label is shown (or no strength label)

### Requirement: Why for highlights
Highlighted segments SHALL be focusable. Focusing or activating one SHALL show the `why` of the spans covering it in a region, and the segment SHALL reference the region with `aria-describedby` while it is shown. A detection whose spans yield no highlight SHALL show its `why` under its entry. A result without `plain_language` or span `why` SHALL render as before, with no why region.

#### Scenario: Focus a highlight
- **WHEN** a highlight whose span has `why` is focused
- **THEN** a region shows that `why` as literal text and the highlight's `aria-describedby` points to it

#### Scenario: Detection without spans
- **WHEN** a Detection has `spans: []` and `plain_language.why`
- **THEN** that `why` is shown under its entry

#### Scenario: Stored result
- **WHEN** a Detection has no `plain_language` and its spans no `why`
- **THEN** `display` and `explanation` are shown and focusing a highlight shows no region

### Requirement: LLM-assessed group
When the `llm_techniques` run has `succeeded` with findings, the view SHALL list them under the heading "Other possible issues (AI-assessed, less reliable)", separate from the technique list, each with a name, a definition, an explanation and the quoted span `text` as plain text. Name and definition SHALL follow the technique source rule, keyed by `label`; the explanation SHALL follow the localized text rules. Findings with an unknown `label` SHALL be ignored.

#### Scenario: Finding listed
- **WHEN** a finding has `confidence: 0.87` and span text `<b>300%</b>`
- **THEN** the group shows `<b>300%</b>` literally and no confidence value

#### Scenario: Catalog name by label
- **WHEN** the UI language is `de`, `explanation_language` is `fr` and the label is `misleading_headline`
- **THEN** the finding is headed "Irreführende Überschrift"

#### Scenario: Unknown label
- **WHEN** a finding has label `fabricated_authority`
- **THEN** it is not shown

### Requirement: Job view enum labels and API strings
Analyzer status, detection strength and analyzer names SHALL map the enum value or analyzer id to a catalog key; an unknown status SHALL render as the raw value and an unknown analyzer id SHALL show the API `name`. API-provided strings (input text and title, API fallback texts of techniques and findings, error codes, the API error `message` of an unknown error code) SHALL be shown unchanged and SHALL NOT be passed through `t()`.

#### Scenario: Unknown analyzer status
- **WHEN** an analyzer has status `weird_status`
- **THEN** its pill shows `weird_status`

#### Scenario: API text
- **WHEN** an analyzer id is not in the catalog and its `name` is "Bot detection"
- **THEN** the row shows "Bot detection" unchanged

## ADDED Requirements

### Requirement: Technique name and definition source
A technique's name and definition SHALL come from the `techniques` catalog keyed by `Detection.name` when the UI language differs from the result's `explanation_language`, otherwise from `plain_language`, falling back to `display` and `explanation` when missing or empty. A `Detection.name` the catalog lacks SHALL use the API texts and log a `console.warn` in development.

#### Scenario: Interface language differs
- **WHEN** `explanation_language` is `fr`, the UI language is `ar` and the Detection is `Loaded_Language`
- **THEN** the heading and definition are the `ar` catalog's, not the French `plain_language`

#### Scenario: Identifier without catalog entry
- **WHEN** the UI language differs from `explanation_language` and a Detection has an unknown `name`
- **THEN** the entry shows `plain_language.name` and `definition`

### Requirement: Localized why
When a technique is localized from the catalog, its `why` SHALL be the `why_span` template filled with the localized name and the span `text` verbatim (`why_no_span` for a detection without spans); otherwise it is the API `why`. A result without an API `why` SHALL still show none.

#### Scenario: Localized why
- **WHEN** the UI language is `ar`, `explanation_language` is `fr` and the span text is `mensonges`
- **THEN** the region shows the Arabic template with the Arabic technique name and `mensonges` unchanged

### Requirement: Availability notes
The note of a settled analyzer SHALL be chosen from the catalog by `reason` and `availability`, never by matching text. An unknown availability SHALL count as unavailable; an availability the catalog cannot place keeps the API `note`.

#### Scenario: Analyzer name and note by catalog
- **WHEN** the locale is `de`, the analyzer id is `fact_check` and it is skipped with reason `no_checkable_claims`
- **THEN** its row shows the German analyzer name and the German note, not the API strings

### Requirement: Localization requests
For a job with `done: true` whose text language is known and differs from the UI language, the view SHALL request `getJobLocalization(id, uiLanguage)` once per (job, language) and keep the answer in an in-memory cache. The text language is `translation.source_language` for a finalizer `user_text`, English for an orchestrator `user_text` and `explanation_language` for LLM explanations; an unknown language SHALL NOT trigger a request, nor a job that is not done.

#### Scenario: Not done
- **WHEN** the job has `done: false`
- **THEN** no localization request is sent

### Requirement: Language switch stability
Switching the UI language SHALL NOT refetch the job, reopen the event stream, collapse open sections or request a language already fetched.

#### Scenario: Switch to Arabic and back
- **WHEN** a French done job is shown in French and the user switches to Arabic, then German, then Arabic and French
- **THEN** exactly two localization requests (`ar`, `de`) and no further job request are sent, and the open detailed section stays open

### Requirement: Localized text rendering
A text with `status: translated` SHALL be shown as plain text with a localized "Machine-translated from {language}" label (naming the source language when known) and a toggle to show the original. A text with `status: original` SHALL be shown as is. While the request is pending the original SHALL be shown.

#### Scenario: Translated text
- **WHEN** `final_assessment.user_text` is `{status: "translated", text: "…", source_language: "fr"}` and the UI language is `ar`
- **THEN** the translated text is shown with the Arabic "machine-translated from French" label and a button that shows the original French text

### Requirement: Localization fallback
An `unavailable` or unknown status, a failed request (409, 400, network error) or a missing entry SHALL show the original text with a localized note that it is not available in the UI language, and SHALL NOT be presented as localized.

#### Scenario: Unavailable or failed
- **WHEN** the status is `unavailable` or `pending`, or the request fails with 409
- **THEN** `finalization.result.user_text` is shown with the localized "not available in this language" note and no "machine-translated" label

### Requirement: Original evidence isolation
Span text, quotes, the analyzed content and title and the submitted text SHALL be shown verbatim in every UI language and SHALL be isolated with `dir="auto"` (a `<bdi dir="auto">` for inline text) so that French or English quotations stay left-to-right on an Arabic page. Layout of the added markers SHALL use CSS logical properties.

#### Scenario: French quote on an Arabic page
- **WHEN** the UI language is `ar` and a finding quotes the French span `300 % de hausse`
- **THEN** the quote is inside `<bdi dir="auto">` and its text is unchanged
