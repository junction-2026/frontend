# job-result-view Specification

## Purpose
Defines the job result view of the frontend: when it is shown, how it fetches and polls a job, and how technique spans are validated, highlighted and explained in the user's original text.

## Requirements

### Requirement: Routing
The App SHALL render the job result view when `location.search` has a non-empty `job` parameter, and otherwise the existing health check UI unchanged.

#### Scenario: Job parameter
- **WHEN** the URL is `/?job=abc`
- **THEN** the job result view is rendered and no `/healthz` request is sent

#### Scenario: No job parameter
- **WHEN** the URL has no `job` parameter or `job=` is empty
- **THEN** the health check UI is rendered

### Requirement: Job fetching and polling
The view SHALL fetch `GET /api/v1/jobs/{id}` (id URL-encoded, same-origin base as `/healthz`), SHALL poll every 2000 ms while the job `done` is not true and `status` is not `completed`, `failed` or `cancelled`, and SHALL stop polling on a terminal status or unmount. A network error or HTTP 404 SHALL show an error message with `role="alert"` and stop polling.

#### Scenario: Polling until done
- **WHEN** the first response has `status: running` and the second `status: completed`
- **THEN** a second request is sent after 2 s and no third request follows

#### Scenario: Not found
- **WHEN** the response is 404
- **THEN** an element with `role="alert"` is shown and no further request is sent

### Requirement: Highlight segmentation
Segmentation SHALL be a pure function from `(content, spans[])` to ordered segments `{text, techniques[]}` using UTF-16 indices, splitting at every span boundary so overlapping spans are represented. The segment texts SHALL concatenate to `content` exactly.

#### Scenario: Overlapping spans
- **WHEN** spans of two techniques overlap partly
- **THEN** the overlap is its own segment listing both techniques and the concatenation equals `content`

### Requirement: Span validation
A span SHALL be used only if `start` and `end` are integers, `0 <= start < end <= content.length` and `content.slice(start, end) === text`. Other spans SHALL be dropped without error.

#### Scenario: Invalid span
- **WHEN** a span's slice differs from its `text`, or its range is outside the content
- **THEN** it is not highlighted and the view renders normally

### Requirement: Plain text rendering
Content, span text, `display` and `explanation` SHALL be rendered as React text nodes (no `dangerouslySetInnerHTML`, no Markdown) inside a container with `white-space: pre-wrap`. Highlighted segments SHALL be `<mark>` elements with `data-techniques` and an accessible label naming the techniques' display names.

#### Scenario: Markup in content
- **WHEN** content is `<i>They</i> are LYING` with a span on `LYING`
- **THEN** `<i>They</i>` is shown literally, no `i` element exists and only `LYING` is inside a `<mark>`

#### Scenario: Characters outside the BMP
- **WHEN** content is `😡 They are LYING to you.` and a span has `start: 3`, `end: 25`
- **THEN** the `<mark>` text equals the span `text`

### Requirement: Technique list
Below the text the view SHALL list one entry per `detected` technique as a button, with a heading of `plain_language.name` and below it `plain_language.definition`, falling back to `display` and `explanation` when they are missing or empty, plus the span count. Selecting an entry SHALL emphasise only that technique's spans. A technique without spans SHALL show "no exact phrase found". Techniques SHALL be keyed by `Detection.name`, never by `plain_language.name`.

#### Scenario: Select a technique
- **WHEN** the user presses the entry of one technique
- **THEN** only marks containing that technique are emphasised

#### Scenario: Plain-language entry
- **WHEN** a Detection has `plain_language` `{name: "Geladene Sprache", definition: "…"}`
- **THEN** the entry shows that name as heading and that definition below it, not `display` or `explanation`

### Requirement: Notes for missing span data
When `span_status` is `failed`, `timeout` or any value other than `ok`, the view SHALL show a "highlighting unavailable" note. A result without `span_status` SHALL list techniques without a highlight and without a note. When the `techniques` run is missing or not `succeeded`, the view SHALL show "no technique analysis available". `sentences[]` SHALL never be rendered as the user's text.

#### Scenario: Span step timed out
- **WHEN** `span_status` is `timeout` and `detected` has one technique with `spans: []`
- **THEN** the technique is listed, nothing is highlighted and the note is shown

#### Scenario: Translation sentences
- **WHEN** `offsets_in` is `translation` and `sentences` carry text
- **THEN** that text is not rendered anywhere

### Requirement: Indicator copy and accessibility
The view SHALL state that detections are indicators of a technique, not proof, and SHALL NOT show scores as probabilities. Technique entries SHALL be keyboard-operable buttons with `aria-pressed`, and highlight colours SHALL meet WCAG AA contrast (4.5:1) against the text.

#### Scenario: Copy
- **WHEN** a technique analysis is shown
- **THEN** the text says detections are indicators, not proof, and no score value is shown

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
