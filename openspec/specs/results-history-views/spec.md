# results-history-views Specification

## Purpose
Defines the Results, Detailed analysis and History screens of the frontend: what they fetch from the analysis jobs API, how verdicts, finalization, job states, coverage and analyzer outcomes are presented, and which parts are marked as mock.

## Requirements

### Requirement: Results fetching and meta row
The Results screen (`/jobs/:id`) SHALL fetch `getJob` and, while `done` is false, SHALL poll every 2000 ms and show a "Watch live progress" link to `/jobs/:id/live`. The meta row SHALL show the job id and the duration from `created_at` to `finished_at` (when finished). A model name and a latency SHALL NOT be shown as real values.

#### Scenario: Running job
- **WHEN** the first response has `done: false`
- **THEN** a "Watch live progress" link to `/jobs/j1/live` is shown and a second request follows after 2000 ms

#### Scenario: Finished job
- **WHEN** the job is done with `created_at` and `finished_at` 3.2 s apart
- **THEN** the meta row shows the job id and the duration and no "Model:" text

### Requirement: Verdict card
For a completed `finalization.result` on a job that is not `failed` or `cancelled`, Results SHALL render one `<section data-verdict>` card above all other content: a header row (status pill at inline-start, confidence at inline-end), an h2 headline, one summary paragraph, 0 to 3 info cards and an optional "Read full explanation" disclosure. `data-verdict` SHALL come only from `verdictOf(result.verdict)`, never from confidence. The partial-coverage note stays inside the card.

#### Scenario: Detected
- **WHEN** the verdict is `detected`
- **THEN** exactly one verdict section with `data-verdict="detected"`, the headline "Yes, propaganda detected." and the pill "Propaganda detected" is shown

#### Scenario: Unknown verdict
- **WHEN** the verdict is `suspicious`
- **THEN** the component has `data-verdict="uncertain"`, the headline "The result is inconclusive." and the pill "Inconclusive"

#### Scenario: Not detected
- **WHEN** the verdict is `not_detected`
- **THEN** the headline "No clear signs of propaganda." and the pill "No clear signs" are shown

#### Scenario: Markup in user text
- **WHEN** `user_text` is `<b>fake</b> [click](https://example.com)`
- **THEN** it is shown literally inside the verdict component and no `b` or `a` element is created

#### Scenario: Insufficient evidence
- **WHEN** the verdict is `uncertain` and `produced_by` is `orchestrator`
- **THEN** the pill reads "Insufficient evidence" inside the verdict component

### Requirement: Finalization states
While `finalization.status` is `pending` or `running`, or the job is not `done`, it SHALL show "Final assessment in progress". `skipped` SHALL show the reason: `not_configured` "No final assessment configured", `disabled_by_request` "Final assessment turned off for this job", `cancelled` "Final assessment cancelled". `failed` SHALL show "Final assessment failed" and `error.code` (`timeout` as "Timed out"). A done job without a result SHALL show "No final assessment is available for this job."

#### Scenario: Skipped by request
- **WHEN** finalization is `skipped` with `reason: disabled_by_request`
- **THEN** "Final assessment turned off for this job" is shown and no verdict component or confidence is shown

#### Scenario: Done without finalization
- **WHEN** the job is done and has no finalization result
- **THEN** the pill "No final assessment" and "No final assessment is available for this job." are shown with a neutral background

#### Scenario: Finalization timed out
- **WHEN** finalization is `failed` with `error.code: timeout`
- **THEN** "Final assessment failed" and "Timed out" are shown and the job is not shown as failed

#### Scenario: In progress
- **WHEN** finalization is `running` and the job is not done
- **THEN** "Final assessment in progress" and the "Watch live progress" link are shown and no verdict

### Requirement: Technique tags
The detailed analysis region of the Results screen SHALL show one tag per detected technique of the `succeeded` `techniques` run, labelled `plain_language.name` falling back to `display`, without a score. Optional members (`strength`, `located`, `margin`, `summary`) SHALL be ignored or used only when present; none SHALL be required. The tags SHALL NOT be shown while the region is collapsed.

#### Scenario: Tags without scores
- **WHEN** the run detected `Loaded_Language` with `score: 0.91` and the region is expanded
- **THEN** one tag "Loaded Language" is shown and no `0.91` or `91%`

### Requirement: Job states
A job with `status: failed` and `scrape.status: failed` SHALL show a scrape error card with `scrape.error.code` and `message` as plain text; any other `failed` job SHALL show "Analysis failed". `cancelled` SHALL show "Cancelled". An unknown status SHALL be treated by `done`. A failed or timed-out analyzer SHALL NOT make the job appear failed.

#### Scenario: Failed scrape
- **WHEN** the job is `failed` and `scrape.error` is `{"code": "account_private", "message": "Account is private"}`
- **THEN** the scrape error card shows `account_private` and `Account is private` and no verdict

#### Scenario: Analyzer failure only
- **WHEN** one analyzer is `failed` and the job is `completed`
- **THEN** "Analysis failed" is not shown

### Requirement: Coverage and analyzer outcomes
The detailed analysis region SHALL contain a section showing `coverage` as `succeeded`, `failed` and `skipped` of `applicable` with a bar sized by `settled / total`, and one row per AnalyzerRun with its name, a status pill and its `note`. A `failed` run with `error.code` `timeout` SHALL read "Timed out". A run whose `availability` is not `ran`, `not_applicable` or null SHALL be presented as unavailable. Runs `skipped` with reason `disabled` or `not_selected` SHALL be collapsed under "Not run".

#### Scenario: Timed-out analyzer
- **WHEN** a run is `failed` with `error.code: timeout` and the region is expanded
- **THEN** its row shows "Timed out"

#### Scenario: Unknown availability
- **WHEN** a run has `availability: "partial"`
- **THEN** its row shows "Unavailable"

#### Scenario: Collapsed runs
- **WHEN** two runs are `skipped` with `not_selected` and `disabled`
- **THEN** they are listed only inside a "Not run" disclosure

### Requirement: Detail metrics
The Detail screen (`/jobs/:id/detail`) SHALL show a metrics bar with Patterns, the number of detected techniques of the `succeeded` `techniques` run (otherwise "—"), and Claims, the number of `claims` of a `succeeded` `topic_extraction` run (otherwise "—"). Confidence SHALL NOT be shown; Risk and Latency SHALL be wrapped in `Mock`. Technique entries SHALL show `Detection.name` as ID badge and no match percentage.

#### Scenario: Metrics
- **WHEN** two techniques were detected and `topic_extraction` succeeded with three claims
- **THEN** Patterns shows 2, Claims shows 3 and no confidence is shown

#### Scenario: Claims unavailable
- **WHEN** `topic_extraction` failed
- **THEN** Claims shows "—"

### Requirement: History listing and filters
The History screen (`/history`) SHALL call `listJobs` with `limit` 20, show items in the returned order (newest first) and, while `next_cursor` is non-null, a "Load more" button that appends the next page. The filter chips All, Running, Completed, Failed and Cancelled SHALL set `?status=` (All omits it) and reset pagination. No counts SHALL be shown. Items SHALL be grouped by local day ("Today", "Yesterday", the date) with the number of loaded items in the group.

#### Scenario: Pagination
- **WHEN** the first page has `next_cursor: "c1"` and the user presses "Load more"
- **THEN** the next request has `cursor=c1` and its items are appended; with `next_cursor: null` the button is absent

#### Scenario: Status filter
- **WHEN** the user selects Failed
- **THEN** the list is requested with `status=failed` and without a cursor

### Requirement: History items
Each item SHALL show the job id, a status pill, a verdict tag from `finalization.verdict` (null shows the finalization status), the relative time from `created_at` and a "Reopen Analysis →" link to `/jobs/{id}`.

#### Scenario: Item without verdict
- **WHEN** `finalization.verdict` is null and `finalization.status` is `pending`
- **THEN** the item shows the finalization status instead of a verdict tag

### Requirement: History excerpts
Each item SHALL show an excerpt fetched with `getJob` per loaded item, with at most 4 requests in flight: the first 140 characters of `input.content`, or of `scrape.url` when there is no input, as plain text, or "Excerpt unavailable" when the request fails.

#### Scenario: Excerpt failure
- **WHEN** `getJob` for an item fails
- **THEN** the item shows "Excerpt unavailable" and the other items are unaffected

#### Scenario: Concurrency
- **WHEN** ten items are loaded
- **THEN** never more than four `getJob` requests are pending at once

### Requirement: History mock parts
The search box, the "Export Ledger" button and the texts "Synchronized" and "Workspace session local" SHALL be wrapped in `Mock`; the search input SHALL be disabled.

#### Scenario: Search is a mock
- **WHEN** the History screen is shown
- **THEN** the search box has a `Mock` ancestor and is disabled, and the job items have none

### Requirement: Loading, empty, error and not-found states
Loading SHALL show a skeleton with `role="status"`. An empty history SHALL show "No previous analyses yet" with a "Start first analysis" link to `/`. Error envelopes SHALL be shown with `role="alert"` using the foundation message mapping. A 404 on a job SHALL show "Job not found" and stop polling.

#### Scenario: Not found
- **WHEN** `getJob` answers 404
- **THEN** "Job not found" is shown with `role="alert"` and no further request is sent

#### Scenario: Empty history
- **WHEN** `listJobs` returns no items
- **THEN** "No previous analyses yet" and a "Start first analysis" link to `/` are shown

### Requirement: Detail verdict text
The Detail screen (`/jobs/:id/detail`) SHALL show a "Final assessment" section with the verdict label and `finalization.result.user_text` as a plain text node (no HTML, Markdown or links) when `finalization.status` is `completed` with a `result`, and SHALL omit the section otherwise. A result with `produced_by` `orchestrator` SHALL show the "Insufficient evidence" tag in that section. No confidence or score number SHALL be shown.

#### Scenario: Markup in user text
- **WHEN** `user_text` is `<b>fake</b> [click](https://example.com)`
- **THEN** exactly those characters are shown and no `b` or `a` element is created from them

#### Scenario: No completed result
- **WHEN** the finalization is `skipped`
- **THEN** no "Final assessment" section is shown

### Requirement: Verdict component presentation
The verdict card SHALL have a 1px solid border in the verdict border token, a border radius of `var(--radius-verdict)` (30px), padding `clamp(20px, 4vw, 36px)`, a shadow of at most `0 1px 2px rgba(0,0,0,.04)` and no gradient or decorative graphic. It SHALL appear with a fade and rise of at most 300ms, disabled under `prefers-reduced-motion`. Logical CSS properties mirror it in RTL; all states share one layout. Results SHALL NOT use `VERDICT_UI` labels.

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** the verdict component has no entrance animation

### Requirement: Verdict states
Each verdict state SHALL use its own tokens from the Verdict tokens requirement of ui-design-foundation, the headline and pill given in Verdict card, and the fixed sentence `results.verdict.<v>.body`: `detected` "VEIL identified signs of manipulative messaging in this content.", `uncertain` and unknown "The available evidence is insufficient or conflicting.", `not_detected` "VEIL did not identify strong indicators of propaganda in this content.".

#### Scenario: Detected
- **WHEN** the verdict is `detected`
- **THEN** the card uses the green tokens and, when `user_text` yields no usable sentence, the sentence "VEIL identified signs of manipulative messaging in this content."

#### Scenario: Uncertain
- **WHEN** the verdict is `uncertain` or unknown
- **THEN** the card uses the amber tokens and, when `user_text` yields no usable sentence, the sentence "The available evidence is insufficient or conflicting."

#### Scenario: Not detected
- **WHEN** the verdict is `not_detected`
- **THEN** the card uses the blue tokens and, when `user_text` yields no usable sentence, the sentence "VEIL did not identify strong indicators of propaganda in this content."

### Requirement: Non-verdict states
Job and finalization states without a completed result SHALL render as a neutral or error card using the existing pill tones, never a verdict background, heading or confidence. "View detailed analysis" SHALL stay available in all of them so analyzer results remain reachable, including those of a `cancelled` job.

#### Scenario: Cancelled
- **WHEN** the job is `cancelled`
- **THEN** "Cancelled" is shown without a verdict or confidence and the analyzer rows are reachable through "View detailed analysis"

### Requirement: Confidence display
The verdict component SHALL show `${Math.round(c * 100)}% confidence` when `result.confidence` is a finite number `c` with `0 <= c <= 1`. Otherwise (null, missing, non-number, NaN, out of range) it SHALL show "Confidence unavailable" and no number. No other score or percentage SHALL appear in the verdict component. This replaces the former rule that confidence is never shown as a number for the Results verdict only; the Detail metrics bar SHALL still show no confidence.

#### Scenario: Confidence shown
- **WHEN** `confidence` is `0.94`
- **THEN** "94% confidence" is shown

#### Scenario: Confidence unavailable
- **WHEN** `confidence` is `null`, missing, `NaN`, a string or `1.2`
- **THEN** "Confidence unavailable" is shown and no `%`

### Requirement: Confidence tooltip
Next to the confidence line a button with `aria-label` "What does confidence mean?" SHALL show an element with `role="tooltip"` on hover and focus and hide it on blur, mouse leave and Escape; the button SHALL reference it with `aria-describedby`. The tooltip text SHALL be "How confident VEIL's final assessment is that this verdict is supported by the available evidence. It is not the probability that the content is propaganda."

#### Scenario: Focus
- **WHEN** the button receives keyboard focus
- **THEN** the tooltip with that text appears and the button's `aria-describedby` references it; pressing Escape hides it

### Requirement: Verdict explanation
When the trimmed `result.user_text` differs from the summary, the card SHALL show a "Read full explanation" button (`aria-expanded`, `aria-controls`) that toggles a block with the complete `user_text` as a React text node (never HTML or Markdown, never linkified; `white-space: pre-wrap`, `dir="auto"`) and the machine-translation note when present. Collapsed content SHALL NOT be rendered. The 280-code-point truncation and "Show full explanation" no longer exist.

#### Scenario: Markup in user text
- **WHEN** `user_text` is `<b>fake</b> [click](https://example.com)` and is shown as the summary or in the full explanation
- **THEN** exactly those characters are shown and no `b` or `a` element is created

#### Scenario: Long text
- **WHEN** `user_text` has several sentences and the user presses "Read full explanation"
- **THEN** `aria-expanded` is true and the complete text is shown in place

### Requirement: Initial actions
Below the verdict card the Results screen SHALL show a primary `<button class="btn-primary">` "View detailed analysis" and a secondary link "Ask VEIL" (class `btn-secondary`, `href` `/ask`). Before the detailed region is opened only the meta row, the verdict card (or state card) and these actions SHALL be shown; the one technique name on the Top technique card is the only technique shown. Non-verdict state cards keep their content and tones.

#### Scenario: Initial view
- **WHEN** a completed job with techniques and analyzers is shown
- **THEN** no technique tag, coverage, analyzer row, highlighted text, claim, metrics bar, Polarity/Intensity, bias-factor or excerpt is shown

### Requirement: Progressive disclosure
"View detailed analysis" SHALL carry `aria-expanded` and `aria-controls` pointing to the detailed region (`role="region"`, `aria-label` "Detailed analysis"). It SHALL be collapsed on every load and collapsed content SHALL NOT be rendered. Expanding SHALL mount the region with a fade and slide of at most 300ms (none under `prefers-reduced-motion`) and change the button label to "Hide detailed analysis"; collapsing SHALL unmount it; focus SHALL stay on the button.

#### Scenario: Expand and collapse
- **WHEN** the user presses "View detailed analysis" and then "Hide detailed analysis"
- **THEN** `aria-expanded` is false, true, false and the region is present only while expanded

### Requirement: Detailed analysis region content
The detailed region SHALL contain the analyzed excerpt (first 400 characters), the technique tags, the Mock-wrapped Polarity/Intensity row and "High rhetorical bias factor", "Explore coverage", "Open detailed analysis page" and the Copy and Share buttons, followed by the Coverage section.

#### Scenario: Expanded content
- **WHEN** the region is expanded
- **THEN** it shows the excerpt, technique tags, coverage and the link to `/jobs/:id/detail`

### Requirement: Shared detail body
The Detail metrics bar (Patterns, Claims, Mock Risk and Latency) and the full JobView (title, highlighted text, technique list, why region, notes, LLM-assessed group) SHALL be one component shared by `/jobs/:id/detail` and the detailed region of `/jobs/:id`; `/jobs/:id/detail` SHALL render as before.

#### Scenario: Metrics in the region
- **WHEN** two techniques were detected and the region is expanded
- **THEN** the metrics bar shows Patterns "2 detected" and the JobView content is present

### Requirement: Partial evidence warning
When a verdict is shown and `coverage.failed` is greater than 0 or any AnalyzerRun has status `failed` (including timeouts), the verdict component SHALL contain a small muted note with `role="note"`: "Some analyzers did not finish, so this result is based on partial evidence." A failed analyzer SHALL NOT make the job appear failed.

#### Scenario: Analyzer failed
- **WHEN** a verdict is shown and one analyzer run is `failed` with `error.code: timeout`
- **THEN** the note is shown inside the verdict component

### Requirement: History verdict labels unchanged
History verdict tags SHALL keep "Manipulation detected" (orange), "No manipulation indicators" (green) and "Uncertain" (purple); `VERDICT_UI` SHALL keep its values.

#### Scenario: History tags
- **WHEN** the History screen shows items with the three verdicts
- **THEN** the tag labels and tones are those above

### Requirement: Results and Detail copy from the results catalog
All fixed text of `/jobs/:id` and `/jobs/:id/detail` (meta row, verdict headings and bodies, confidence line and tooltip, state cards, actions, Detail heading, back link and final assessment) and of `/states` SHALL come from the `results` catalog in the active locale for en, fr, ar, de and fi. The English text quoted in the Results and Detail requirements of this capability is the `en` catalog value.

#### Scenario: Another locale
- **WHEN** the locale is `de` and the verdict is `detected`
- **THEN** the Results heading reads "Ja, Propaganda erkannt.", the Detail label reads "Manipulation erkannt", and `user_text` is shown unchanged

#### Scenario: Language switch
- **WHEN** the user switches the language while Results is open
- **THEN** the page re-renders in the new language without a reload

### Requirement: Results enum labels and API strings
The verdict label on Detail SHALL map the verdict enum to `results.verdict.label.*`; an unknown verdict keeps reading as uncertain. The finalization skip reason SHALL map to a catalog key, any other reason reads "No final assessment was made." in the locale. API-provided strings (`user_text`, the scrape error `message` and `code`, the finalization error `code`) SHALL be shown unchanged and SHALL NOT be passed through `t()`. History verdict labels stay as they are in this change.

#### Scenario: Scrape failure
- **WHEN** the locale is `de` and the job failed with a scrape error whose `message` is English
- **THEN** the pill reads "Abruf fehlgeschlagen" and the headline is the API `message` unchanged

### Requirement: Results numbers, dates and durations
The confidence SHALL be shown as a whole percent formatted with the active locale ("86%" in en, "86 %" with a non-breaking space in fr); the job duration SHALL use the locale's number formatter with the unit text from the catalog; counts on `/states` use the same formatter.

#### Scenario: French percentage
- **WHEN** the locale is `fr` and the confidence is 0.86
- **THEN** the line reads "86 % de confiance" with a non-breaking space before `%`

#### Scenario: German duration
- **WHEN** the locale is `de` and the job took 3200 ms
- **THEN** the meta row shows "Dauer 3,2 s"

### Requirement: Results layout in right-to-left languages
Results, Detail and States SHALL remain usable with `dir=rtl` (Arabic): the verdict, the detailed region, the highlighted text and the "why" region lay out without physical left or right.

#### Scenario: Arabic
- **WHEN** the locale is `ar`
- **THEN** the document direction is `rtl` and the Results verdict heading is Arabic

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

### Requirement: Mock-only parts of the Results screen
In the detailed analysis region the "Polarity / Intensity" signal row, "High rhetorical bias factor" and the Share button SHALL be wrapped in `Mock`. Copy SHALL copy the page URL to the clipboard without `Mock`. "Explore coverage" SHALL link to `/explore?job=<encoded job id>` and "Open detailed analysis page" to `/jobs/:id/detail`.

#### Scenario: Copy
- **WHEN** the user presses Copy
- **THEN** `navigator.clipboard.writeText` receives the page URL and Copy has no `Mock` ancestor

#### Scenario: Explore coverage link
- **WHEN** Results renders for job `j 1`
- **THEN** the link "Explore coverage" has `href` `/explore?job=j%201` and no "Cross-source coverage" link exists

### Requirement: Ask VEIL link on Results
The Ask VEIL call-to-action card SHALL NOT be shown on Results; the compact "Ask VEIL" link carries no data and SHALL NOT be wrapped in `Mock`.

#### Scenario: Ask VEIL link
- **WHEN** the Results screen is shown
- **THEN** the "Ask VEIL" link points to `/ask`, has no `Mock` ancestor and no "Have questions about this verdict" card is shown

### Requirement: History view fully localized
Every static string of the History view (title, lede, mock labels, search placeholder and aria-label, filter group and buttons, status labels, empty and error states, load-more, relative times and day headings) SHALL come from the catalogs in en, fr, ar, de and fi. Job ids and the quoted excerpt SHALL be wrapped in `<bdi>`. Dates, relative times and counts SHALL use Intl in the active locale. Changing the locale SHALL keep the selected status filter and the loaded list.

#### Scenario: History in Arabic
- **WHEN** History is rendered in ar with one job
- **THEN** it has dir rtl, no static Latin-script text other than the brand and the job id, the id and the excerpt are inside `bdi`, and the status filter stays selected after a locale switch

### Requirement: Verdict headline typography
The headline SHALL use Inter, weight 600, `font-size: clamp(2rem, 1.25rem + 2.6vw, 3.25rem)`, line-height 1.08, letter-spacing -0.02em and `overflow-wrap: anywhere`, and SHALL be the most prominent element of the card.

#### Scenario: Headline size
- **WHEN** the card is rendered
- **THEN** the h2 is at least 32px and at most about 52px

### Requirement: Verdict copy
Verdict copy SHALL come from catalog keys `results.verdict.<v>.heading` and `.pill`; the pill is uppercased by CSS `text-transform` (`none` for Arabic). `detected` uses "Yes, propaganda detected." and "Propaganda detected"; `uncertain` and every unknown value "The result is inconclusive." and "Inconclusive", or "Insufficient evidence" when `produced_by` is `orchestrator`; `not_detected` "No clear signs of propaganda." and "No clear signs".

#### Scenario: Orchestrator uncertain
- **WHEN** the verdict is `uncertain` and `produced_by` is `orchestrator`
- **THEN** the pill reads "Insufficient evidence"

### Requirement: Results action buttons presentation
"View detailed analysis" SHALL be a black (#111) pill with white text, radius 999px, min-height 44px and a 150ms background/transform hover transition (none under reduced motion); "Ask VEIL" a white pill with a 1px #D9D9D9 border and dark text. On desktop the actions sit in a row under the card; under 640px each is full width.

#### Scenario: Mobile actions
- **WHEN** the viewport is narrower than 640px
- **THEN** each action is full width and at least 44px tall

### Requirement: Verdict confidence compact display
The confidence SHALL be shown compact (small, medium weight, the verdict's text colour) as `results.confidence` with the locale's Intl percent of `Math.round(c * 100)` when `result.confidence` is a finite number with `0 <= c <= 1`, otherwise "Confidence unavailable". The existing tooltip button and text stay unchanged. The word "consensus" and any other percentage SHALL NOT appear on the card.

#### Scenario: Confidence never restyles
- **WHEN** the verdict is `uncertain` and `confidence` is 0.95
- **THEN** the card keeps `data-verdict="uncertain"`

### Requirement: Verdict summary
The summary SHALL come from `src/job/summary.ts`: the first sentence of the shown `user_text` (the localized text when available, otherwise the original), trimmed, when it has 20 to 220 code points; otherwise the fixed `results.verdict.<v>.body` sentence. Text SHALL NOT be truncated mid-sentence and no reason SHALL be added. It is rendered as a plain text node with `dir="auto"`.

#### Scenario: First sentence
- **WHEN** `user_text` is "This text pressures the reader. It repeats a slogan."
- **THEN** the summary is "This text pressures the reader."

#### Scenario: Unusable sentence
- **WHEN** the first sentence has fewer than 20 or more than 220 code points, or no sentence exists
- **THEN** the summary is the fixed verdict sentence

#### Scenario: Sentence splitting
- **WHEN** the text is split
- **THEN** `Intl.Segmenter(locale, { granularity: 'sentence' })` is used, or without Segmenter a split after `.`, `!`, `?`, `؟` or `。` followed by whitespace

### Requirement: Verdict info card row
Below the summary the card SHALL show up to three info cards computed from existing result members only, each with a label, a value and an optional status line with a status dot (verdict tone, neutral grey for neutral states). Numbers use Intl formatting and plurals `Intl.PluralRules`.

#### Scenario: Card presentation
- **WHEN** a card is shown
- **THEN** it is white with a 1px `rgba(0,0,0,.06)` border, 18px radius, 14-16px padding and values with `overflow-wrap: anywhere`

#### Scenario: Desktop
- **WHEN** the viewport is at least 640px wide
- **THEN** up to three cards sit in one row (`grid-template-columns: repeat(auto-fit, minmax(0, 1fr))`)

#### Scenario: Mobile
- **WHEN** the viewport is narrower than 640px
- **THEN** the cards stack in one column

### Requirement: Top technique card
`topTechnique` in `src/job/verdictCards.ts` SHALL read techniques through `readTechniques` and pick the best strong detection. The label is "Top technique", the value the localized technique name, the status "Detected" for verdict `detected` and "Signal, not conclusive" otherwise. LLM findings SHALL NOT be ranked.

#### Scenario: Strong candidates
- **WHEN** an entry has `strength` `strong`, or has no `strength` and at least one valid span
- **THEN** it is a candidate

#### Scenario: Ranking
- **WHEN** a weak detection comes first and a located strong detection comes second
- **THEN** the card names the strong one; ties rank by located, `margin` descending (missing = 0), valid span count descending, then name ascending

#### Scenario: Weak only
- **WHEN** no detection is strong
- **THEN** the value is "No strong technique" in a neutral tone

#### Scenario: No techniques run
- **WHEN** the techniques run is missing, failed or skipped
- **THEN** the card is omitted

### Requirement: Evidence card
`evidencePassages` SHALL collect the valid `[start,end)` spans (job-result-view span validation against `input.content`) of all techniques `detected[].spans` and of `llm_techniques` findings whose `span.field` is `content`, sort them and merge ranges when `start < previous end`. The value is the plural string "{n} passages" with status "Located"; with zero ranges while one of the two runs succeeded it is "No located passages".

#### Scenario: Duplicates
- **WHEN** a technique span and an LLM content span are identical or overlap
- **THEN** they count as one passage and invalid spans are dropped

#### Scenario: Both runs unavailable
- **WHEN** both runs are missing, failed or skipped
- **THEN** the card is omitted

### Requirement: Fact-check card
`factChecks` SHALL show, with the `fact_check` run succeeded, "{n} matches" from `result.fact_checks.length` with status "Related checks found", or "No matches" for 0. With the run failed or skipped the value is "Unavailable" and no number is shown. Without a `fact_check` run the card is replaced by "Techniques": the count of strong detections with status "Supported", only when the techniques run succeeded, otherwise omitted. Copy SHALL NOT say a fact-check confirms the verdict.

#### Scenario: Fact-check failed
- **WHEN** the `fact_check` run failed or was skipped
- **THEN** the card shows "Unavailable" and no number

#### Scenario: No fact-check run
- **WHEN** the job has no `fact_check` run and techniques succeeded
- **THEN** the "Techniques" card shows the number of strong detections

### Requirement: Verdict card localization
Every string of the verdict card (pills, headlines, the "Top technique", "Evidence", "Fact-checks" and "Techniques" labels, statuses, the plural passages/matches/techniques strings, "Read full explanation"/"Hide full explanation", neutral values) SHALL exist in en, fi, de, fr and ar. In `ar` (`dir="rtl"`) the pill sits at the right, the confidence at the left and the cards run right to left; percents and numbers use Intl for the locale and the user text keeps `dir="auto"`.

#### Scenario: Arabic
- **WHEN** the locale is `ar`
- **THEN** the headline, pill, cards and disclosure are Arabic and the card mirrors
