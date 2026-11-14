# job-result-view Specification

## Purpose
Defines the job result view of the frontend: when it is shown, how it fetches and polls a job, and how technique spans are validated, highlighted and explained in the user's original text.

## Requirements

### Requirement: Routing
The job result view (highlighted text, technique list, why region, notes and LLM-assessed group) SHALL be rendered by the router inside the Detail screen for `/jobs/:id/detail`. `/?job=<id>` with a non-empty id SHALL be redirected to `/jobs/<id>` (ui-design-foundation, Legacy job link); with an empty or missing `job` parameter the Home view is rendered.

#### Scenario: Job parameter
- **WHEN** the URL is `/jobs/abc/detail`
- **THEN** the job result view is rendered for id `abc` and requests `/api/v1/jobs/abc`

#### Scenario: Legacy parameter
- **WHEN** the URL is `/?job=abc`
- **THEN** the URL is replaced by `/jobs/abc` and the Results screen is rendered, which links to `/jobs/abc/detail`

#### Scenario: No job parameter
- **WHEN** the URL has no `job` parameter or `job=` is empty
- **THEN** the Home view is rendered

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

### Requirement: Job view copy from the results catalog
All fixed text of the shared job components (highlighted excerpt labels, technique list headings, counts and notes, LLM group, analyzer coverage, metrics bar, loading and not-found copy) SHALL come from the `results` catalog in the active locale for en, fr, ar, de and fi. The English text quoted in the other requirements of this capability is the `en` catalog value. The technique count and the phrase count SHALL use the plural form keys of the locale ("no exact phrase found" is its own key).

#### Scenario: Another locale
- **WHEN** the locale is `de` and a job has one technique without a located phrase
- **THEN** the list heading reads "Erkannte Propagandatechniken", the count reads "(keine genaue Passage gefunden)", and the technique definition is the API text unchanged

### Requirement: Job view enum labels and API strings
Analyzer status, detection strength and analyzer names SHALL map the enum value or analyzer id to a catalog key; an unknown status SHALL render as the raw value and an unknown analyzer id SHALL show the API `name`. API-provided strings (input text and title, API fallback texts of techniques and findings, error codes, the API error `message` of an unknown error code) SHALL be shown unchanged and SHALL NOT be passed through `t()`.

#### Scenario: Unknown analyzer status
- **WHEN** an analyzer has status `weird_status`
- **THEN** its pill shows `weird_status`

#### Scenario: API text
- **WHEN** an analyzer id is not in the catalog and its `name` is "Bot detection"
- **THEN** the row shows "Bot detection" unchanged

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

#### Scenario: LLM highlight why
- **WHEN** an LLM highlight is focused and its explanation is translated
- **THEN** the why region shows the translated text with the same machine-translated label and toggle as the findings list

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

### Requirement: Wikipedia lookup section
The job view SHALL show a read-only "Wikipedia lookup" section built from the AnalyzerRun with `id` `wikipedia`, followed by the "Term context section". For each claim of the result it SHALL show the claim text and, for each WikiLookup in order, the edition's language name, the page title and the `passage`, separately and verbatim. While the run is `pending` or `running` the section SHALL NOT be rendered.

#### Scenario: Two editions
- **WHEN** the run succeeded and a claim has a found `de` and a found `en` WikiLookup
- **THEN** each passage is shown in its own block with "Wikipedia (German)" or "Wikipedia (English)" and its title, unchanged and unmerged

### Requirement: Wikipedia passages are not merged
The section SHALL NOT combine passages, SHALL NOT present a passage as a translation of the other, SHALL NOT show a true/false verdict and SHALL show no count. A WikiLookup whose `status` is not `found` (an unknown `status` included) or whose `passage` is empty SHALL be shown as "no page found in this edition", without a passage.

#### Scenario: Page not found
- **WHEN** a WikiLookup has `status: "no_page"`, `ambiguous` or an unknown status
- **THEN** its block reads "No page found in this edition" and the claim is not presented as false or unverified

### Requirement: Wikipedia lookup availability
The section SHALL render the note "No Wikipedia lookup available" instead of claims when the `wikipedia` run is missing, `skipped` or `failed`, or `succeeded` without a `claims` array. This SHALL NOT be presented as an error and not as "Wikipedia has nothing on it".

#### Scenario: Failed run
- **WHEN** the `wikipedia` run has `status: "failed"`
- **THEN** the section shows "No Wikipedia lookup available" and no passage

#### Scenario: Deployment without the analyzer
- **WHEN** the job has no AnalyzerRun with id `wikipedia`
- **THEN** the section shows "No Wikipedia lookup available" without error

### Requirement: Wikipedia text is plain and isolated
Claim, title, passage, evidence sentence and compared value `text` SHALL be rendered as plain text, without HTML or Markdown interpretation and without turning their contents into links. Each SHALL be direction-isolated (`dir="auto"` on a block, a `<bdi dir="auto">` inline) so it keeps its own direction in a right-to-left UI. Their wording SHALL NOT be replaced by a translation in any UI language.

#### Scenario: Markup in a passage
- **WHEN** a `passage` is `<b>bold</b> [x](https://example.com)`
- **THEN** exactly those characters are shown, and no element other than the section's own markup and no link is created from them

### Requirement: Wikipedia links
A WikiLookup `url` and a CrossLanguageDifference `url` SHALL be rendered as a link only when it parses as an absolute `https` URL whose host ends in `.wikipedia.org`; the link text is the page title (the `url` itself when there is none) and it opens with `rel="noopener noreferrer"`. Any other value (`http`, another host, a host that only contains `wikipedia.org` elsewhere, a relative or protocol-relative URL, `javascript:`) SHALL be shown as plain text, never as a link.

#### Scenario: Not a Wikipedia host
- **WHEN** a `url` is `https://de.wikipedia.org.evil.example/x` or `http://de.wikipedia.org/x`
- **THEN** it is not a link

### Requirement: Wikipedia coverage labels
For a found WikiLookup the section SHALL show its `coverage` as a localized label: `no_coverage`, `mentioned`, `aligned` or `conflicts`; an unknown or absent `coverage` SHALL be shown as `no_coverage`. For `aligned` and `conflicts` the `evidence_sentence` SHALL be shown as plain text. `conflicts` SHALL use the warning tone (orange tag); every other label the neutral tone. A label SHALL describe the evidence sentence only ("has a different number or date"), never the claim as true or false.

#### Scenario: Unknown coverage
- **WHEN** a found WikiLookup has `coverage: "partially_aligned"` or no `coverage`
- **THEN** it shows the `no_coverage` label

### Requirement: Cross-language state
For each claim the section SHALL present `cross_language` as follows. `agree`: the neutral note "Both editions give the same numbers and dates". `gap`: the neutral note "Only one language edition had a page for this claim". `null`, a missing member and an unknown value SHALL show no comparison and no error. The state SHALL NOT be presented as a verdict on the claim.

#### Scenario: Agree
- **WHEN** a claim has `cross_language: "agree"`
- **THEN** the neutral note "Both editions give the same numbers and dates" is shown, also when neither passage has a number or date

#### Scenario: Unknown or absent state
- **WHEN** `cross_language` is `null`, missing or `"partial"`
- **THEN** no comparison note is shown and no error is shown

### Requirement: Cross-language discrepancy
For `discrepancy` the section SHALL show a note with one entry per CrossLanguageDifference, in order: the edition's language name, the link (see "Wikipedia links") and each differing value quoted by its `text`. An entry with no values says "No value of its own". A missing, null or malformed `cross_language_differences` SHALL show the note without entries.

#### Scenario: Discrepancy with one empty side
- **WHEN** `cross_language` is `discrepancy` and the `de` entry has `values: []` and the `en` entry has the value with `text` `1945`
- **THEN** the `de` entry reads "No value of its own" and the `en` entry quotes “1945” with its language and link

### Requirement: Gap and discrepancy are not coverage conflicts
A `gap` SHALL be shown without discrepancy, disagreement or conflict wording and without the warning tone. A `discrepancy` SHALL use a tone (purple border) distinct from the `conflicts` coverage tag. No count of conflicts, discrepancies or gaps SHALL be shown, so none includes a `gap` or `discrepancy`.

#### Scenario: Gap next to a conflicts label
- **WHEN** a claim has `cross_language: "gap"` and its found WikiLookup has `coverage: "conflicts"`
- **THEN** the `conflicts` label is shown for that WikiLookup only, the gap note is neutral and has no conflict wording, and no conflict is counted for the gap

### Requirement: Wikipedia copy from the results catalog
All fixed text of the Wikipedia section SHALL come from `results.wiki.*` keys present in en, de, fr, fi and ar, covered by the catalog completeness test. Edition names use the language name of the UI language.

#### Scenario: Another locale
- **WHEN** the locale is `de` and a claim has `cross_language: "agree"`
- **THEN** the note reads "Beide Ausgaben nennen dieselben Zahlen und Daten"

### Requirement: Term context section
The job view SHALL show a read-only "Term context" section after the Wikipedia lookup section, built from the AnalyzerRun `term_context` with existing ui-design-foundation tokens only. It SHALL show one card per TermContext with the `term`, the `in_post` sentence, the encyclopedia quote with its link or a no-coverage note, the `elsewhere` snippets with links, and a sense label. It SHALL NOT be rendered while the run is `pending` or `running`.

#### Scenario: Full card
- **WHEN** the run succeeded and a TermContext has an EncyclopediaQuote, two `elsewhere` items and `sense: same`
- **THEN** one card shows the term, the post sentence, the encyclopedia quote with its link, both snippets with their links and the label "The quotes use the term for the same thing"

#### Scenario: No coverage
- **WHEN** a TermContext has `encyclopedia: "no_coverage"` (or a non-object value)
- **THEN** its card reads "No Wikipedia page of its own for this term" and shows no encyclopedia quote

#### Scenario: Nothing to compare
- **WHEN** a TermContext has `elsewhere: []`, `encyclopedia: "no_coverage"` and `sense: "unknown"`
- **THEN** the card reads "No news snippet contains this term" and the label "No other quote to compare with"

### Requirement: Term context is read tolerantly
Unknown members SHALL be ignored, a non-object `encyclopedia` SHALL read as no coverage and an unknown `sense` SHALL read as `unknown`.

#### Scenario: Unknown members
- **WHEN** the result or a TermContext has members the client does not know, or `sense` is an unknown value
- **THEN** they are ignored and the card is shown with the label for `unknown`

### Requirement: Term context availability
The section SHALL read "No term context available" when the `term_context` run is missing, `skipped` or `failed`, or `succeeded` without a `terms` array; this SHALL NOT be presented as an error or as "the post has no such terms". A succeeded run with `terms: []` SHALL read "No loaded or unfamiliar terms were picked from the post".

#### Scenario: Skipped run
- **WHEN** the `term_context` run is `skipped` or `failed`
- **THEN** the section shows "No term context available" and no card

#### Scenario: No terms kept
- **WHEN** the run succeeded with `terms: []`
- **THEN** the section shows "No loaded or unfamiliar terms were picked from the post"

### Requirement: Term context text is plain and isolated
`term`, `in_post`, `quote`, `title`, `snippet` and `domain` SHALL be rendered as plain text, without HTML or Markdown interpretation and without turning their content into links, each inside an element with `dir="auto"` so that an RTL quote does not reorder the surrounding labels. An encyclopedia `url` SHALL be a link only when it is an absolute `https` URL whose host ends in `.wikipedia.org`; an elsewhere `url` only when its scheme is `http` or `https`; otherwise the title is shown as text.

#### Scenario: Markup in a snippet
- **WHEN** a `snippet` is `<b>x</b> [y](https://example.com)`
- **THEN** exactly those characters are shown, no element or link is created from them

#### Scenario: Disallowed urls
- **WHEN** an encyclopedia `url` has host `example.com` and an elsewhere `url` is `javascript:alert(1)`
- **THEN** neither is rendered as a link

### Requirement: Differing quotes are marked
For `sense: differs` the card SHALL mark each quote referenced by a resolvable `differs_from` QuoteRef (`encyclopedia`, or `elsewhere` with an index of an existing item) with a visible marker and a `data-differs` attribute inside the same card, next to the quote and its link; QuoteRefs that do not resolve SHALL be ignored.

#### Scenario: Snippet differs
- **WHEN** `sense` is `differs` and `differs_from` is `[{"source": "elsewhere", "index": 1}, {"source": "elsewhere", "index": 9}]`
- **THEN** only the second snippet is marked, with its link

### Requirement: Term context sense labels are neutral
Sense labels SHALL state only the relation between the quotes ("The quotes use the term for the same thing", "The quotes use the term for different things", "No other quote to compare with") and SHALL NOT say or imply that the post is right or wrong, define the term or judge the author. The labels, notes and markers SHALL exist in every UI locale including `ru`.

#### Scenario: Differs wording
- **WHEN** a card has `sense: differs`
- **THEN** its label reads "The quotes use the term for different things" and no text of the card says the post is wrong or false

### Requirement: Final assessment keeps its Wikipedia quotations
The final assessment SHALL present only `wikipedia_quotes` entries as quotations from Wikipedia; the encyclopedia quote of a term card is shown only in the Term context section.

#### Scenario: Term context present
- **WHEN** a job has a succeeded `term_context` run and a final assessment without `wikipedia_quotes`
- **THEN** the final assessment shows no Wikipedia quotation

### Requirement: Risk score section placement
The Results screen SHALL render a Risk Score section above the verdict card when `Job.risk` is a non-null object. With `risk` null or missing it SHALL render no risk content and no error, and the rest of the screen SHALL be unchanged. This reads the shared capability `manipulation-risk-score` (shared-specs@3949bec3d32a399427d239e3147239fa1e716cfe).

#### Scenario: Job with a risk score
- **WHEN** the job has `risk` with `status: "scored"`
- **THEN** the Risk Score section appears before the verdict card

#### Scenario: Job without a risk score
- **WHEN** `risk` is null or the member is missing
- **THEN** no risk section is rendered and no error is shown

### Requirement: Risk score headline
For a scored risk the headline SHALL show `Math.round(score * 100)` percent formatted with the locale number formatter, a band chip with the localized band label, and a one-line summary composed from catalog texts by band and first driver, falling back to the server `summary` for an unknown band or driver kind.

#### Scenario: Scored high
- **WHEN** `score` is 0.5932 and `band` is `high`
- **THEN** the headline shows `59%` and a `High risk` chip

### Requirement: Risk band colours
Band chips SHALL use design tokens: low green, moderate yellow, high orange, critical red, with chip text contrast of at least 4.5:1. An unknown band SHALL be styled like moderate and show its id.

#### Scenario: Unknown band
- **WHEN** `band` is `extreme`
- **THEN** the chip shows `extreme` with the moderate colours and the server summary is shown

### Requirement: Risk score context is required
A scored risk without a finite score from 0 to 1, a band or at least one driver SHALL be shown like an unavailable one, and an unknown `status` SHALL be treated as unavailable, so a score never appears without its band, drivers and caveats.

#### Scenario: Scored without drivers
- **WHEN** `status` is `scored` and `drivers` is empty
- **THEN** no percentage is shown

### Requirement: Risk score unavailable
For an unavailable risk the section SHALL show no percentage or band, SHALL explain the `reason` from the catalog (an unknown reason reads as "input not available"), and SHALL still show the info button, the dimension notes and the caveats.

#### Scenario: Nothing to score
- **WHEN** `status` is `unavailable` and `reason` is `no_content_signals`
- **THEN** no percentage is shown, the reason is explained and the caveats are listed

### Requirement: Risk score info tooltip
An info button with an `aria-label` from the catalog SHALL sit beside the headline of every risk section. Its tooltip SHALL open on hover, focus and tap and close on blur and Escape; it SHALL name the three observations (manipulative techniques, propaganda-like writing patterns, signs of artificial amplification) and state that the rating describes the content, not reader reactions. In every locale it SHALL NOT name a model, algorithm, classifier or probability value.

#### Scenario: Keyboard access
- **WHEN** the info button receives focus
- **THEN** a `role="tooltip"` with the description is shown and the button is described by it

### Requirement: Risk dimension breakdown
The section SHALL show one horizontal bar per available dimension (intensity, confirmation, amplification) from 0 to 100 percent with a label, the formatted value and `role="meter"` with `aria-valuenow`. An unavailable dimension SHALL show a note by `reason` (`no_author_context`, `analyzer_unavailable`, `no_bot_score`, `no_scores`; an unknown reason reads as "input not available"). A dimension with `confidence` `low` or amplification `basis` `single_text` SHALL carry a low-confidence marker.

#### Scenario: Amplification unavailable
- **WHEN** `dimensions.amplification` has `available: false` and `reason: "no_author_context"`
- **THEN** two bars and a note for amplification are shown

### Requirement: Risk detected techniques
The section SHALL list `risk.techniques` in their order, each with the display name (the localized technique name where the technique catalog has it, otherwise the server `display`, otherwise the `label`), the probability as a percentage and the impact group label (an unknown group shows its id).

#### Scenario: Two techniques
- **WHEN** `techniques` lists `Loaded_Language` (0.7, high) and `Doubt` (0.35, lower)
- **THEN** two rows show the names, `70%`, `35%` and the group labels in that order

### Requirement: Risk drivers
The section SHALL show each driver as one localized sentence keyed by `kind` (and the technique name for `technique`), falling back to the server `text`; kind `none` shows the no-signal sentence.

#### Scenario: Technique driver
- **WHEN** a driver has `kind: "technique"` and `technique: "Loaded_Language"`
- **THEN** the sentence names the localized technique

### Requirement: Risk caveats
The section SHALL show a collapsible region opened by a button with `aria-expanded`, listing the localized text of each caveat by `id` with the server `text` as fallback for an unknown id. `content_not_reader` SHALL always be listed, also when the server omits it. Caveats SHALL be expanded initially.

#### Scenario: Collapse
- **WHEN** the caveats button is activated
- **THEN** `aria-expanded` becomes `false` and the list is hidden

### Requirement: Risk text rendering and catalog
Server texts (`summary`, driver and caveat `text`, technique `display`, unknown ids) SHALL be rendered as plain text. All fixed texts SHALL be `risk.*` keys of the `results` namespace in en, fr, ar, de, fi and ru, and the section SHALL use logical CSS properties so it lays out in right-to-left languages.

#### Scenario: Markup in a server text
- **WHEN** a caveat with an unknown id has the text `<b>x</b>`
- **THEN** `<b>x</b>` is shown literally
