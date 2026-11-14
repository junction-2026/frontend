## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Verdict headline typography
The headline SHALL use Inter, weight 700, `font-size: clamp(2rem, 1.25rem + 2.6vw, 3.25rem)`, line-height 1.08, letter-spacing -0.02em and `overflow-wrap: anywhere`, and SHALL be the most prominent element of the card.

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
