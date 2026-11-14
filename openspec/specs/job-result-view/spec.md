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
Below the text the view SHALL list one entry per `detected` technique with `display`, `explanation` and span count, as a button. Selecting an entry SHALL emphasise only that technique's spans. A technique without spans SHALL show "no exact phrase found".

#### Scenario: Select a technique
- **WHEN** the user presses the entry of one technique
- **THEN** only marks containing that technique are emphasised

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
