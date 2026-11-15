# results-history-views Specification

## Purpose
Defines the Results, Detailed analysis and History screens of the frontend: what they fetch from the analysis jobs API, how verdicts, finalization, job states, coverage and analyzer outcomes are presented, and which parts are marked as mock.

## Requirements

### Requirement: Results fetching and meta row
The Results screen (`/jobs/:id`) SHALL fetch `getJob` and, while `done` is false, SHALL poll every 2000 ms and show a "Watch live progress" link to `/jobs/:id/live`. The meta row SHALL show the job id and the duration from `created_at` to `finished_at` (when finished). A model name SHALL NOT be shown. The duration formatting SHALL live in one helper shared with the Detail metrics bar Latency, so the two never differ.

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
The Detail metrics bar in the detailed region of `/jobs/:id` SHALL show Patterns (detected techniques of the `succeeded` `techniques` run, else "—"), Claims (`claims` of a `succeeded` `topic_extraction` run, else "—"), Risk (real percentage and band chip, else "—", not in `Mock`) and Latency. Latency follows 'Detail metrics Latency'. Technique entries SHALL show `Detection.name` as ID badge and no match percentage; confidence SHALL NOT be shown.

#### Scenario: Metrics
- **WHEN** two techniques were detected and `topic_extraction` succeeded with three claims
- **THEN** Patterns shows 2, Claims shows 3 and no confidence is shown

#### Scenario: Scored risk
- **WHEN** `risk` is scored with score 0.72 and band `high`
- **THEN** the Risk cell shows the formatted `72%` and a localized `High risk` chip (colours per 'Risk band colours'), with no `Mock` ancestor

#### Scenario: Risk unavailable
- **WHEN** `risk` is unavailable, fails 'Risk score context is required', or is null or missing
- **THEN** the Risk cell shows "—"

#### Scenario: Unknown band
- **WHEN** the band is `extreme`
- **THEN** the chip shows `extreme` with the moderate colours

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
Each item SHALL show the job id, a status pill, a verdict tag from `finalization.verdict` (null shows the finalization status), the relative time from `created_at` and an "Open Analysis →" link to `/jobs/{id}`.

#### Scenario: Item without verdict
- **WHEN** `finalization.verdict` is null and `finalization.status` is `pending`
- **THEN** the item shows the finalization status instead of a verdict tag

### Requirement: Loading, empty, error and not-found states
Loading SHALL show a skeleton with `role="status"`. An empty history SHALL show "No previous analyses yet" with a "Start first analysis" link to `/`. Error envelopes SHALL be shown with `role="alert"` using the foundation message mapping. A 404 on a job SHALL show "Job not found" and stop polling.

#### Scenario: Not found
- **WHEN** `getJob` answers 404
- **THEN** "Job not found" is shown with `role="alert"` and no further request is sent

#### Scenario: Empty history
- **WHEN** `listJobs` returns no items
- **THEN** "No previous analyses yet" and a "Start first analysis" link to `/` are shown

### Requirement: Verdict component presentation
The verdict card SHALL have a 2px solid border in `var(--v-border)`, a border radius of `var(--radius-verdict)` (30px), padding `clamp(20px, 4vw, 36px)`, a shadow of at most `0 1px 2px rgba(0,0,0,.04)` and no gradient or decorative graphic. It SHALL appear with a fade and rise of at most 300ms, disabled under `prefers-reduced-motion`. Logical CSS properties mirror it in RTL; all states share one layout. Results SHALL NOT use `VERDICT_UI` labels.

#### Scenario: Border
- **WHEN** the card is rendered
- **THEN** its border is 2px solid in the verdict border colour

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** the verdict component has no entrance animation

### Requirement: Verdict states
Each verdict state SHALL use its own tokens from the Verdict tokens requirement of ui-design-foundation, the headline and pill given in Verdict card, and the fixed sentence `results.verdict.<v>.body` (unchanged, see the scenarios). The palette SHALL be selected only by `data-verdict`, which is `verdictOf(result.verdict)`, never by confidence.

#### Scenario: Detected
- **WHEN** the verdict is `detected`
- **THEN** the card uses the red tokens and, when `user_text` yields no usable sentence, the sentence "VEIL identified signs of manipulative messaging in this content."

#### Scenario: Uncertain
- **WHEN** the verdict is `uncertain` or unknown
- **THEN** the card uses the amber tokens and, when `user_text` yields no usable sentence, the sentence "The available evidence is insufficient or conflicting."

#### Scenario: Not detected
- **WHEN** the verdict is `not_detected`
- **THEN** the card uses the green tokens and, when `user_text` yields no usable sentence, the sentence "VEIL did not identify strong indicators of propaganda in this content."

#### Scenario: Confidence does not change the palette
- **WHEN** two results have the same verdict and confidence 0.05 and 0.95
- **THEN** both cards have the same `data-verdict` and so the same palette

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
Below the verdict card the Results screen SHALL show a primary `<button class="btn-primary">` "View detailed analysis" and a secondary link "Ask VEIL" (class `btn-secondary`, `href` `/jobs/{id}/ask` with the id URL-encoded). Before the detailed region is opened only the meta row, the verdict card (or state card) and these actions SHALL be shown; the one technique name on the Top technique card is the only technique shown. Non-verdict state cards keep their content and tones.

#### Scenario: Initial view
- **WHEN** a completed job `j1` is shown
- **THEN** the "Ask VEIL" link has `href` `/jobs/j1/ask`

### Requirement: Progressive disclosure
"View detailed analysis" SHALL carry `aria-expanded` and `aria-controls` pointing to the detailed region (`role="region"`, `aria-label` "Detailed analysis"). It SHALL be collapsed on every load and collapsed content SHALL NOT be rendered. Expanding SHALL mount the region with a fade and slide of at most 300ms (none under `prefers-reduced-motion`) and change the button label to "Hide detailed analysis"; collapsing SHALL unmount it; focus SHALL stay on the button.

#### Scenario: Expand and collapse
- **WHEN** the user presses "View detailed analysis" and then "Hide detailed analysis"
- **THEN** `aria-expanded` is false, true, false and the region is present only while expanded

### Requirement: Detailed analysis region content
The detailed region SHALL contain the analyzed excerpt (first 400 characters), the technique tags, "Explore coverage" and the Copy button, followed by the Detail metrics bar, the JobView and the Coverage section. It SHALL NOT contain a link to a separate detail page.

#### Scenario: Expanded content
- **WHEN** the region is expanded
- **THEN** it shows the excerpt, technique tags, "Explore coverage", the Copy button and coverage, and has no link to a detail page

### Requirement: Detail body
The Detail metrics bar (Patterns, Claims, Risk and Latency, all real values) and the full JobView (title, highlighted text, technique list, risk overview, why region, notes, LLM-assessed group) SHALL be one component (DetailedAnalysis) rendered in the detailed region of `/jobs/:id`.

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
All fixed text of `/jobs/:id` (meta row, verdict headings and bodies, confidence line and tooltip, state cards, actions) and of `/states` SHALL come from the `results` catalog in the active locale for en, fr, ar, de and fi. The English text quoted in the Results requirements of this capability is the `en` catalog value.

#### Scenario: Another locale
- **WHEN** the locale is `de` and the verdict is `detected`
- **THEN** the Results heading reads "Ja, Propaganda erkannt." and `user_text` is shown unchanged

#### Scenario: Language switch
- **WHEN** the user switches the language while Results is open
- **THEN** the page re-renders in the new language without a reload

#### Scenario: Removed detail strings
- **WHEN** the `results` catalog of any locale is read
- **THEN** it has no `open_detail`, `detail.back`, `detail.label`, `detail.title`, `detail.lede` or `detail.final` key

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
Results (`/jobs/:id`) and States SHALL remain usable with `dir=rtl` (Arabic): the verdict, the detailed region, the highlighted text and the "why" region lay out without physical left or right.

#### Scenario: Arabic
- **WHEN** the locale is `ar`
- **THEN** the document direction is `rtl` and the Results verdict heading is Arabic

### Requirement: History localization
All fixed text of the History screen (title, filter chips, group counts, status pills, verdict tags, "Open Analysis →", "Excerpt unavailable", export and search texts, empty and loading texts) SHALL come from the `history` catalog in the active locale; every English text quoted in the History requirements of this capability is the `en` catalog value. Job excerpts and API error messages SHALL NOT be translated. Switching language SHALL re-render the screen without reload.

#### Scenario: Arabic History
- **WHEN** the locale is `ar`
- **THEN** the heading, filter chips and "Open Analysis" link render with Arabic text and the document direction is rtl

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
The detailed analysis region SHALL NOT render a Polarity/Intensity signal row, a "High rhetorical bias factor" line or a Share button. Copy SHALL copy the page URL to the clipboard without `Mock`. "Explore coverage" SHALL link to `/explore?job=<encoded job id>`.

#### Scenario: Removed items
- **WHEN** the detailed region of a job with a `detected` verdict is expanded
- **THEN** it contains no "High rhetorical bias factor", no Polarity/Intensity text, no Share button and no `[data-mock]` element

#### Scenario: Copy
- **WHEN** the user presses Copy
- **THEN** `navigator.clipboard.writeText` receives the page URL and Copy has no `Mock` ancestor

#### Scenario: Explore coverage link
- **WHEN** Results renders for job `j 1`
- **THEN** the link "Explore coverage" has `href` `/explore?job=j%201` and no "Cross-source coverage" link exists

### Requirement: Ask VEIL link on Results
The Ask VEIL call-to-action card SHALL NOT be shown on Results; the compact "Ask VEIL" link carries no data and SHALL NOT be wrapped in `Mock`. The static `/states` showcase has no job, so its "Ask VEIL" link keeps `/ask` (the "Choose an analysis" state).

#### Scenario: Ask VEIL link
- **WHEN** the Results screen of job `j 1` is shown
- **THEN** the "Ask VEIL" link points to `/jobs/j%201/ask`, has no `Mock` ancestor and no "Have questions about this verdict" card is shown

### Requirement: History view fully localized
Every static string of the History view (title, lede, export texts, search placeholder and aria-label, filter group and buttons, status labels, empty and error states, load-more, relative times and day headings) SHALL come from the catalogs in en, fr, ar, de and fi. Job ids and the quoted excerpt SHALL be wrapped in `<bdi>`. Dates, relative times and counts SHALL use Intl in the active locale. Changing the locale SHALL keep the selected status filter and the loaded list.

#### Scenario: History in Arabic
- **WHEN** History is rendered in ar with one job
- **THEN** it has dir rtl, no static Latin-script text other than the brand and the job id, the id and the excerpt are inside `bdi`, and the status filter stays selected after a locale switch

### Requirement: Verdict headline typography
The headline SHALL use `var(--font)` (Inter) at weight 800 (`var(--fw-extrabold)`), `font-size: clamp(2rem, 1.25rem + 2.6vw, 3.25rem)`, line-height 1.08, letter-spacing -0.02em and `overflow-wrap: anywhere`, and SHALL be the most prominent element of the card. No other text weight in the card changes.

#### Scenario: Headline size
- **WHEN** the card is rendered
- **THEN** the h2 is at least 32px and at most about 52px

#### Scenario: Headline weight
- **WHEN** the card CSS is read
- **THEN** `.verdict h2` uses `var(--fw-extrabold)` and no other selector in results.css exceeds 600

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

### Requirement: Verdict status pill accent
The verdict pill SHALL have background `var(--v-pill-bg)`, a 1px solid `var(--v-border)` border and text `var(--v-pill-text)`. The info-card status dot and the "Read full explanation" link SHALL keep using the verdict pill text and heading tokens, so these accents follow the verdict palette.

#### Scenario: Pill
- **WHEN** a verdict card is rendered
- **THEN** the pill uses the state's bg, a 1px border in the state's border colour and the state's dark text colour

### Requirement: Pulsing status dot
`.verdict-dot` (8px circle, `aria-hidden`) SHALL be filled with `var(--v-pill-text)` and have a box-shadow glow of the same colour at reduced alpha. A keyframe animation SHALL scale the glow and opacity subtly (opacity at least 0.6, scale at most 1.15) with duration between 1.5s and 2s, `ease-in-out`, `infinite`. Under `prefers-reduced-motion: reduce` the dot SHALL have `animation: none` and keep a static glow. Non-verdict state cards SHALL NOT get a pulsing dot.

#### Scenario: Pulse
- **WHEN** a verdict card is rendered
- **THEN** the dot pulses with an infinite ease-in-out animation of 1.8s

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** the dot has no animation and keeps a static glow

### Requirement: History header without meta line
The History header SHALL NOT render a meta line (ledger index, session, sync state). No History element SHALL be wrapped in `Mock`.

#### Scenario: No meta line in any locale
- **WHEN** the History screen is shown in en, fr, ar, de, fi or ru
- **THEN** no ledger index, session or synchronized text is shown and the screen has no `[data-mock]` element

### Requirement: History search
The search box SHALL be an enabled `type=search` input with the `history.search_placeholder` placeholder and the `history.search_aria` aria-label. Its value SHALL be sent trimmed as `listJobs` `q` 300 ms after the last keystroke (immediately on Enter); an empty value SHALL send no `q`.

#### Scenario: Debounced search with status
- **WHEN** the status filter is Failed and the user types "needle" and waits 300 ms
- **THEN** the list is requested with `status=failed&q=needle` and no cursor

#### Scenario: Enter
- **WHEN** the user types "needle" and presses Enter
- **THEN** the list is requested at once with `q=needle`

#### Scenario: Cleared search
- **WHEN** the user clears the input
- **THEN** the list is requested without `q` and the normal list is shown again

### Requirement: History search paging and stale answers
Changing `q` or the status SHALL drop the loaded pages and fetch the first page for the new (q, status). An answer for a previous (q, status) SHALL be ignored. "Load more" SHALL send the same `q` and `status` with the cursor.

#### Scenario: Match on a later page
- **WHEN** the only match is on page 2 of the unfiltered list and the user searches for it
- **THEN** it is shown from the first search page

#### Scenario: Load more with a query
- **WHEN** the search page has `next_cursor: "c1"` and the user presses "Load more"
- **THEN** the request carries the same `q` and `status` and `cursor=c1`

#### Scenario: Late answer
- **WHEN** the answer for the previous `q` arrives after the one for the current `q`
- **THEN** it is not shown

### Requirement: History no-match state
When `q` is non-empty and the first page is empty, the screen SHALL show `history.empty.search` with the query shown as plain text instead of the "start analysing" empty state.

#### Scenario: No match
- **WHEN** the search `<b>zzz</b>` has no items
- **THEN** "No analyses match “<b>zzz</b>”" is shown literally, without an element created, and no "Start first analysis" link

### Requirement: History export
The enabled Export button SHALL page `GET /api/v1/jobs` with `limit=100` and the active `status`, `q` and `language` until `next_cursor` is null, then download one file `history-YYYY-MM-DD.csv` (local date): UTF-8 with BOM, CRLF, RFC 4180 quoting, header `id,created_at,status,finalization_status,verdict,excerpt,language`, one row per job in list order, null or missing values as empty cells. Header names are fixed and not translated. An empty history SHALL give a header-only file.

#### Scenario: Several pages
- **WHEN** the filter is Completed and the list has three pages
- **THEN** three requests with `limit=100&status=completed` (cursors in turn) are sent and one file with all rows is downloaded

#### Scenario: Quoting
- **WHEN** an excerpt is `say "hi", ok` followed by a line break and `bye`
- **THEN** its cell is quoted with the inner quotes doubled

#### Scenario: Empty history
- **WHEN** the list is empty
- **THEN** a file with only the header row is downloaded and no error is shown

#### Scenario: Language filter and column
- **WHEN** the language filter is Russian and the user exports
- **THEN** the requests carry `language=ru` and each row ends with the job's language code, empty when it has none

### Requirement: History export formula safety
Export SHALL prefix a single quote to any cell that starts with `=`, `+`, `-`, `@`, tab or CR.

#### Scenario: Formula excerpt
- **WHEN** an excerpt is `=SUM(A1)`
- **THEN** its cell is `'=SUM(A1)`

### Requirement: History export states
While exporting, the Export button SHALL be disabled with `aria-busy` and the label `history.exporting`. On an API error it SHALL show the localized API error with `role=alert` and download nothing. The button SHALL carry `title` and `aria-description` `history.export_hint`, stating that the export follows the active filter and search.

#### Scenario: Busy
- **WHEN** the export is running
- **THEN** the button is disabled, has `aria-busy="true"` and reads "Exporting…"

#### Scenario: Error
- **WHEN** a page request answers 400 `invalid_request`
- **THEN** "The request was not valid" is shown and no file is downloaded

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

### Requirement: Detail metrics Latency
The Latency cell of the Detail metrics bar SHALL show `finished_at` minus `created_at`, formatted like the meta-row duration (`results.duration.ms` under 1000 ms, else `results.duration.s`) and not wrapped in `Mock`. When `finished_at` is null or the span is missing, unparseable or negative it SHALL show "—".

#### Scenario: Latency under one second
- **WHEN** the job finished 284 ms after `created_at`
- **THEN** Latency shows `284 ms` with no `Mock` ancestor

#### Scenario: Latency in seconds
- **WHEN** `created_at` is `2026-11-14T10:00:00Z` and `finished_at` is `2026-11-14T10:00:03.200Z`
- **THEN** Latency shows `3.2 s` (en), with no `Mock` ancestor, and no hardcoded `412` appears

#### Scenario: Latency unavailable
- **WHEN** `finished_at` is null, or the timestamps are unparseable or the span is negative
- **THEN** Latency shows "—"

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

### Requirement: Text-origin reader
`botTextOf(job)` SHALL return `{label, score}` only when the AnalyzerRun with `id` `bot_detection` has `status` `succeeded` and its `result.scope` is `text`, `result.label` is `human` or `bot_or_generated` and `result.score` is a finite number from 0 to 1; otherwise it SHALL return `null`. Unknown result members SHALL be ignored. Reads shared `bot-detection-result` (shared-specs@92a5491bf6c142f2322523c4a24e41a5b04d4946).

#### Scenario: Valid result
- **WHEN** `bot_detection` succeeded with `{label: "bot_or_generated", score: 0.87, scope: "text", extra: 1}`
- **THEN** the reader returns `{label: "bot_or_generated", score: 0.87}`

#### Scenario: Invalid or absent result
- **WHEN** the run is missing, `skipped`, `failed`, or succeeded with no `scope`, a `scope` other than `text`, a label such as `mixed`, or a score of 1.2, -0.1, `"0.5"` or NaN
- **THEN** the reader returns `null` without throwing

### Requirement: Text-origin marker
For a non-null `botTextOf` result, the verdict card SHALL render inside `.verdict-confidence`, after the confidence info button, an inline small neutral pill with class `verdict-origin` reading `Looks generated` for `bot_or_generated` and `Looks human-written` for `human` (localized). It SHALL NOT add a section or card and SHALL render nothing for a null result. The score SHALL be shown only as a percentage in the tooltip text, never as confidence in `human`.

#### Scenario: Generated
- **WHEN** `bot_detection` succeeded with `{label: "bot_or_generated", score: 0.87, scope: "text"}`
- **THEN** `.verdict-confidence` contains a `.verdict-origin` marker reading `Looks generated` after the confidence info button, and the card text shows no `87`

#### Scenario: Human
- **WHEN** the result has `label: "human"` and `score: 0.1`
- **THEN** the marker reads `Looks human-written` and its tooltip says about 10% probability of bot or generated, not confidence in human

#### Scenario: No signal
- **WHEN** `bot_detection` is missing, skipped, failed or invalid
- **THEN** no `.verdict-origin` exists, no error is shown and the confidence reading is unchanged

### Requirement: Text-origin marker accessibility
The marker SHALL be a focusable `button` with an `aria-label` and, on hover or focus, a `role="tooltip"` text referenced by `aria-describedby`, dismissed by Escape and on blur or mouse leave. The text SHALL say that the model checked this text only, in its original language, that it is not a verdict about the author or account, and that it is not propaganda detection.

#### Scenario: Focus
- **WHEN** the marker is focused
- **THEN** a tooltip with that text appears and Escape hides it

### Requirement: Text-origin copy in all locales
Keys `results.origin.bot_or_generated`, `results.origin.human` and `results.origin.tip` (with `{pct}`) SHALL exist in the en, de, fi, fr, ru and ar results catalogs.

#### Scenario: Locale
- **WHEN** the locale is `de`, `fi`, `fr`, `ru` or `ar` and the marker is shown
- **THEN** its label and tooltip are localized with no raw key or `{pct}`

### Requirement: Detailed summary card presentation
The `.card.detailed-summary` in the expanded detailed region SHALL have inner padding of at least 1rem block and 1.15rem inline, in LTR and RTL, so its content never touches the border. "Explore coverage" SHALL stay an anchor link styled as a secondary button scoped to `.detailed-summary`. The copy icon button SHALL keep its aria-label, title and behaviour and stay at the inline end.

#### Scenario: Card padding
- **WHEN** the detailed region is expanded
- **THEN** `.card.detailed-summary` has non-zero padding on all four sides and its chips, links and copy button lie inside it, with `dir` ltr or rtl

#### Scenario: Links keep their meaning
- **WHEN** the detailed region is expanded for job `j 1`
- **THEN** "Explore coverage" is an `<a>` with href `/explore?job=j%201` and the card has no "Open detailed analysis page" link and no anchor whose href ends in `/detail`

#### Scenario: Button styling
- **WHEN** the link is rendered
- **THEN** it has a 1px border, a background, horizontal padding, a minimum height of 44px and a pill radius, and under 640px the link MAY wrap to full width

#### Scenario: Button states
- **WHEN** the link has keyboard focus, is hovered or is pressed
- **THEN** it shows a focus ring of at least 2px with at least 3:1 contrast, a distinct hover background and a distinct active background, transitions last at most 150ms and none run under `prefers-reduced-motion`

### Requirement: History export button sizing
The History toolbar Export button SHALL keep its intrinsic `.btn-secondary` size and SHALL be aligned to the block-start of the toolbar row, never stretched to the title and lede height. The fix SHALL be scoped to the History toolbar and SHALL NOT change global `.btn-secondary` styles.

#### Scenario: Export button is not stretched
- **WHEN** the History toolbar renders the Export button next to the title and lede
- **THEN** the button has `align-self: flex-start` and keeps its padding-driven height

#### Scenario: Exporting state
- **WHEN** an export is in progress (disabled, aria-busy)
- **THEN** the button keeps the same compact size and alignment

#### Scenario: Regression coverage
- **WHEN** the `.toolbar > .btn-secondary` rule loses `align-self: flex-start`
- **THEN** the HistoryView regression test fails

#### Scenario: Direction, wrapping and state
- **WHEN** the toolbar renders in LTR or RTL, wraps at 390 px or fewer, or the button is exporting (disabled, aria-busy)
- **THEN** the button keeps its natural size and block-start alignment

### Requirement: History language filter
The History filter bar SHALL have a single-select language control with a visible label (`history.language.label`) and the options All (sends no parameter), the fixed list en, de, fr, es, it, ru, uk, pl, ro, nl, pt, ar, zh, each named by `Intl.DisplayNames` in the UI locale (falling back to the code), and Unknown (`unknown`). It SHALL be keyboard operable like a native select. The chosen value SHALL be sent as `listJobs` `language` together with `status` and `q`.

#### Scenario: Options
- **WHEN** History is shown in English
- **THEN** the control offers "All languages", "English", "German", … and "Unknown" with values ``, `en`, `de`, … `unknown`

#### Scenario: Select a language
- **WHEN** the status is Failed and the user selects German
- **THEN** the list is requested with `status=failed&language=de` and no cursor

### Requirement: History language in the URL
The status, search and language SHALL be stored in the `/history` URL query (`status`, `q`, `language`), written without adding history entries and read when the screen loads; a value that is not one of the offered choices SHALL be ignored. Changing the language SHALL drop the loaded pages and fetch the first page; "Load more" SHALL send the same `status`, `q` and `language`.

#### Scenario: Reload
- **WHEN** the URL is `/history?status=failed&q=needle&language=fr`
- **THEN** the first request is `status=failed&q=needle&language=fr`, and the controls show those values

#### Scenario: Invalid value
- **WHEN** the URL has `language=deu`
- **THEN** the list is requested without `language`

#### Scenario: Paging reset
- **WHEN** the user has loaded a second page and selects a language
- **THEN** the request has no cursor and the older pages are gone

### Requirement: History language empty and error states
With a language filter and no search text, an empty first page SHALL show `history.empty.language` and a "Clear filters" button that resets status, search and language; a search keeps `history.empty.search` and also gets the button. An API error SHALL be shown as the existing localized alert.

#### Scenario: No match
- **WHEN** the language is Chinese and the list is empty
- **THEN** "No analyses in this language" and a "Clear filters" button are shown and no "Start first analysis" link

#### Scenario: Error
- **WHEN** the request with a language fails with 400 `invalid_request`
- **THEN** the alert "The request was not valid" is shown

### Requirement: History item language label
Each item SHALL show a tag with `history.language.item` and the language: its `Intl.DisplayNames` name in the UI locale, the raw code when it has no name, or `history.language.unknown` for null or a missing member.

#### Scenario: Labels
- **WHEN** items have `language` `de`, `zz`, null and no member
- **THEN** they show "Language: German", "Language: zz", "Language: Unknown" and "Language: Unknown"

### Requirement: History solid background
`HistoryView` SHALL render no decorative backdrop layer (no `.archive-bg`, no inline bookshelf SVG, no scrim) in any state (loading, loaded, empty, error), so the page shows the body's solid `var(--bg)`. It SHALL NOT render `.ambient-bg`; the ambient background stays `HomeView`-only and unchanged.

#### Scenario: All states
- **WHEN** `HistoryView` is rendered while loading, loaded, empty and in error
- **THEN** `section.view` is its only top-level element, and no `.archive-bg`, `.ambient-bg`, `<canvas>` or decorative `<svg>` exists outside it

### Requirement: History stacking and contrast
Removing the former `.archive-bg + .view` rule SHALL NOT change the visible stacking of the sticky topbar or the hosting badge relative to the page content. Body text on History SHALL keep at least 4.5:1 contrast against `var(--bg)`.

#### Scenario: Chrome keeps stacking
- **WHEN** the History page is scrolled
- **THEN** the sticky topbar and the hosting badge stay above the page content
