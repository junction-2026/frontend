## MODIFIED Requirements

### Requirement: Technique list
Below the text the view SHALL list one entry per `detected` technique as a button, with a heading of `plain_language.name` and below it `plain_language.definition`, falling back to `display` and `explanation` when they are missing or empty, plus the span count. Selecting an entry SHALL emphasise only that technique's spans. A technique without spans SHALL show "no exact phrase found". Techniques SHALL be keyed by `Detection.name`, never by `plain_language.name`.

#### Scenario: Select a technique
- **WHEN** the user presses the entry of one technique
- **THEN** only marks containing that technique are emphasised

#### Scenario: Plain-language entry
- **WHEN** a Detection has `plain_language` `{name: "Geladene Sprache", definition: "…"}`
- **THEN** the entry shows that name as heading and that definition below it, not `display` or `explanation`

## ADDED Requirements

### Requirement: Why for highlights
Highlighted segments SHALL be focusable. Focusing or activating one SHALL show the `why` of the spans covering it in a region, and the segment SHALL reference the region with `aria-describedby` while it is shown. A detection whose spans yield no highlight SHALL show `plain_language.why` under its entry. A result without `plain_language` or span `why` SHALL render as before, with no why region.

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
When the `llm_techniques` run has `succeeded` with findings, the view SHALL list them under the heading "Other possible issues (AI-assessed, less reliable)", separate from the technique list, each with `name`, `definition`, `explanation` and the quoted span `text` as plain text. Findings with an unknown `label` SHALL be ignored.

#### Scenario: Finding listed
- **WHEN** a finding has `confidence: 0.87` and span text `<b>300%</b>`
- **THEN** the group shows `<b>300%</b>` literally and no confidence value

#### Scenario: Unknown label
- **WHEN** a finding has label `fabricated_authority`
- **THEN** it is not shown

### Requirement: LLM group availability and confidence
The view SHALL NOT show `confidence`, compare it with model scores or merge findings into the technique list. When the `llm_techniques` run exists and is `failed` or `skipped`, the group SHALL show "AI-assessed check not available"; when the run is absent, nothing SHALL be shown.

#### Scenario: Run failed
- **WHEN** the `llm_techniques` run is `failed`
- **THEN** "AI-assessed check not available" is shown

#### Scenario: Run absent
- **WHEN** the job has no `llm_techniques` run
- **THEN** no AI-assessed text is shown

### Requirement: Title and LLM highlights
When `Job.input.source.title` is a non-empty string the view SHALL show it above the content as plain text. LLM spans with `field: "content"` SHALL be highlighted in the content and `field: "title"` spans in the shown title, using a style distinct from model technique highlights, after the same offset validation as model spans (UTF-16 offsets, slice equals `text`). A finding whose offsets do not match its field's string SHALL be listed without highlight.

#### Scenario: Title span with non-BMP characters
- **WHEN** the title is `😡 Vaccine KILLS thousands` and the span's offsets cover `KILLS thousands`
- **THEN** exactly that text is inside a `<mark>` in the title

#### Scenario: Offset mismatch
- **WHEN** a finding's slice differs from its span `text`
- **THEN** the finding is listed and nothing is highlighted
